import { onBeforeUnmount, watchEffect } from 'vue'

/**
 * 动态更新页面的 TDK (Title, Description, Keywords)
 * @param {Object|Function} tdkOptions - TDK 配置，支持响应式对象或返回对象的函数
 */
export function useTDK (tdkOptions) {
  const updateTDK = (options) => {
    const { title, description, keywords } = typeof options === 'function' ? options() : options

    // 更新 Title
    if (title) {
      document.title = title
    }

    // 更新 Description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.name = 'description'
        document.head.appendChild(metaDescription)
      }
      metaDescription.content = description
    }

    // 更新 Keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.name = 'keywords'
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.content = keywords
    }
  }

  // 使用 watchEffect 自动监听响应式数据变化并更新
  const stop = watchEffect(() => {
    updateTDK(tdkOptions)
  })

  onBeforeUnmount(() => {
    stop()
  })
}

// 导出全局 mixin，以支持选项式 API
export const tdkMixin = {
  created () {
    const tdk = this.$options.tdk
    if (tdk) {
      this.$watch(
        () => (typeof tdk === 'function' ? tdk.call(this) : tdk),
        (newTDK) => {
          if (newTDK) {
            const { title, description, keywords } = newTDK
            if (title) document.title = title

            if (description) {
              let metaDescription = document.querySelector('meta[name="description"]')
              if (!metaDescription) {
                metaDescription = document.createElement('meta')
                metaDescription.name = 'description'
                document.head.appendChild(metaDescription)
              }
              metaDescription.content = description
            }

            if (keywords) {
              let metaKeywords = document.querySelector('meta[name="keywords"]')
              if (!metaKeywords) {
                metaKeywords = document.createElement('meta')
                metaKeywords.name = 'keywords'
                document.head.appendChild(metaKeywords)
              }
              metaKeywords.content = keywords
            }
          }
        },
        { immediate: true, deep: true }
      )
    }
  }
}
