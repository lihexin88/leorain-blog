export function uploadToOss (file, uploadUrl, processCb = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        processCb && processCb(Math.min(99, Math.round((event.loaded / event.total) * 100)))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        processCb && processCb(100)
        resolve()
      } else {
        reject(new Error('上传失败'))
      }
    }
    xhr.onerror = () => reject(new Error('上传失败'))
    xhr.setRequestHeader('Content-Type', '')
    xhr.send(file)
  })
}
