<template>
  <el-card>
    <template v-slot:header>
      <div class="article-contents-title">
      <span>
      文章目录
      </span>
        <span @click="go_top">
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
      // 获取所有 h1-h6 标签，优先从文章内容区域查找
      let headings = document.querySelectorAll('#article-show-content h1,#article-show-content h2,#article-show-content h3,#article-show-content h4,#article-show-content h5,#article-show-content h6')

      // 如果找不到，尝试从 .markdown 类中查找
      if (headings.length === 0) {
        headings = document.querySelectorAll('.markdown h1,.markdown h2,.markdown h3,.markdown h4,.markdown h5,.markdown h6')
      }

      // 如果在 .markdown 类中找不到标题，则在文章内容容器中查找
      if (headings.length === 0) {
        headings = document.querySelectorAll('.article-content h1,.article-content h2,.article-content h3,.article-content h4,.article-content h5,.article-content h6')
      }

      // 如果仍然找不到，在整个文档中查找
      if (headings.length === 0) {
        headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
      }

      // 过滤掉没有ID的标题
      const validHeadings = Array.from(headings).filter(heading => heading.id)

      const headingArray = validHeadings
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
      // 使用层级数组来跟踪每个层级的最后一个节点
      const levelNodes = [null, null, null, null, null, null] // 对应h1到h6

      validHeadings.forEach(heading => {
        const level = parseInt(heading.tagName[1])
        const label = heading.textContent.trim()
        const currentNode = { label, id: heading.id }

        if (level === 1) {
          // h1 直接作为根节点
          result.push(currentNode)
          levelNodes[0] = currentNode
        } else {
          // 找到上一级节点
          const parentLevel = level - 2 // 转换为数组索引（h2对应0，h3对应1...）
          const parentNode = levelNodes[parentLevel]

          if (parentNode) {
            // 如果有父节点，则作为子节点添加
            if (!parentNode.children) {
              parentNode.children = []
            }
            parentNode.children.push(currentNode)
          } else {
            // 如果没有父节点（比如文章直接从h3开始），则作为根节点
            result.push(currentNode)
          }

          // 更新当前层级的节点
          levelNodes[level - 1] = currentNode
        }
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
    },
    init () {
      this.get_toc_list()
      console.log(this.headings)
      window.addEventListener('scroll', () => {
        this.checkActiveHeading()
      })
      this.checkActiveHeading()
    }
  },
  mounted () {
  },
  computed: {}
}
</script>

<style scoped lang="scss">
.contents-go-top:hover {
  color: #00F7DE;
}
.article-contents-title{
  display: flex;
  justify-content: space-between;
}
</style>
