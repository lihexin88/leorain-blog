<template>
  <el-card style="width: 95%">
    <template v-slot:header>
      <div class="clearfix">
      <span>
      文章目录
      </span>
        <span style="position: absolute;right: 25px;cursor: pointer" @click="go_top">
        [<span class="contents-go-top">回顶部</span>]
      </span>
      </div>
    </template>
    <div>
      <div>
        <el-tree ref="tree" :highlight-current="true"
                 node-key="id" :default-expand-all="true" :current-node-key="current_node_key"
                 :expand-on-click-node="false"
                 :data="toc" :props="defaultProps" empty-text="暂未设置目录"
                 @node-click="handleNodeClick"></el-tree>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  data () {
    return {
      toc: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      headings: [],
      current_node_key: 0,
      comment_area_heading: {
        label: '[--评论--]',
        id: 'article-comment-area'
      }
    }
  },
  methods: {
    handleNodeClick (contentObj) {
      this.current_node_key = contentObj.id
      const element = document.getElementById(contentObj.id)
      if (element) {
        const top = element.getBoundingClientRect().top + window.scrollY - 50
        window.scrollTo({ top, behavior: 'smooth' })
      }
    },
    go_top () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    get_toc_list () {
      // 获取所有 h1-h6 标签，如果找不到 .markdown 类，则在整个文档中查找
      let headings = document.querySelectorAll('.markdown h1,.markdown h2,.markdown h3,.markdown h4,.markdown h5,.markdown h6')

      // 如果在 .markdown 类中找不到标题，则在文章内容容器中查找
      if (headings.length === 0) {
        headings = document.querySelectorAll('.article-content h1,.article-content h2,.article-content h3,.article-content h4,.article-content h5,.article-content h6')
      }

      // 如果仍然找不到，在整个文档中查找
      if (headings.length === 0) {
        headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
      }

      const headingArray = Array.from(headings)
      const commentArea = document.getElementById('article-comment-area')
      if (commentArea) {
        headingArray.push(commentArea)
      }

      // 过滤掉 null 元素
      this.headings = headingArray.filter(heading => heading !== null)

      if (this.headings.length === 0) {
        this.toc = [this.comment_area_heading] // 无标题时返回评论区域
        return
      }

      let result = []
      let stack = []

      // 找到最小的标题级别，例如可能从 h2 开始
      const minLevel = Math.min(...Array.from(headings).map(h => parseInt(h.tagName[1])))

      headings.forEach(heading => {
        const level = parseInt(heading.tagName[1])
        const label = heading.textContent.trim()

        const currentNode = { label, id: heading.id }

        // 计算相对层级，使得最小标题层级作为根节点
        const relativeLevel = level - minLevel + 1

        // 维护正确的层级结构
        while (stack.length >= relativeLevel) {
          stack.pop() // 弹出比当前层级更深的节点
        }

        if (stack.length === 0) {
          // 作为根级标题
          result.push(currentNode)
        } else {
          // 作为子级标题
          const parent = stack[stack.length - 1]
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(currentNode)
        }

        stack.push(currentNode) // 当前节点入栈
      })
      result.push(this.comment_area_heading)

      this.toc = result
    },
    checkActiveHeading () {
      const headings = this.headings
      let activeId = ''
      let closestHeading = null
      let minDistance = Number.POSITIVE_INFINITY

      headings.forEach(heading => {
        // 检查 heading 是否存在且有效
        if (!heading || !heading.getBoundingClientRect) return

        const rect = heading.getBoundingClientRect()
        const distanceFromTop = Math.abs(rect.top) // 计算标题到视口顶部的距离

        // 只考虑仍在视口内或刚滚过的标题
        if (rect.top >= 0 && distanceFromTop < minDistance) {
          minDistance = distanceFromTop
          closestHeading = heading
        }
      })

      if (closestHeading) {
        activeId = closestHeading.id
      }

      if (activeId !== this.activeId) {
        if (this.$refs.tree) {
          this.$refs.tree.setCurrentKey(activeId)
        }
        this.activeId = activeId
      }
    }
  },
  mounted () {
    this.get_toc_list()
    window.addEventListener('scroll', () => {
      this.checkActiveHeading()
    })
    this.checkActiveHeading()
  },
  computed: {}
}
</script>

<style scoped lang="scss">
.contents-go-top:hover {
  color: #00F7DE;
}
</style>
