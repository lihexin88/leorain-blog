<template>
  <div style="display: flex;justify-content: center;align-items: center;padding-top: 3px">
    <el-image class="asset-cover-image" fit="contain" preview-teleported v-if="asset.type === 1"
              :preview-src-list="preview ? [asset.display_url] : undefined"
              :src="asset.display_url + '?x-oss-process=style/gallery_thumbnail'"></el-image>
    <div v-else-if="asset.type === 2" class="asset-cover-video-wrapper" @click="$emit('preview', asset)">
      <el-image class="asset-cover-image" fit="contain" preview-teleported
                :src="getVideoSnapshotUrl(asset.display_url)"></el-image>
      <div class="asset-cover-video-mask">点击播放</div>
    </div>
    <div v-else-if="asset.type === 3" class="asset-cover-audio-wrapper" @click="$emit('preview', asset)">
      <el-icon class="asset-cover-audio-icon">
        <Microphone/>
      </el-icon>
      <div class="asset-cover-video-mask">点击播放</div>
    </div>
    <div v-else-if="asset.type === 4" class="asset-cover-audio-wrapper" @click="$emit('openDir', asset)">
      <el-icon class="asset-cover-audio-icon">
        <Folder/>
      </el-icon>
    </div>
  </div>
</template>

<script>
import { Microphone, Folder } from '@element-plus/icons-vue'

export default {
  name: 'AssetCover',
  components: { Microphone, Folder },
  props: {
    asset: {
      type: Object,
      required: true
    },
    preview: {
      type: Boolean,
      default: true
    }
  },
  emits: ['preview', 'openDir'],
  methods: {
    getVideoSnapshotUrl (url) {
      if (!url) return ''
      const process = 'x-oss-process=video/snapshot,t_0,f_jpg,w_400,h_0,m_fast'
      return url.includes('?') ? `${url}&${process}` : `${url}?${process}`
    }
  }
}
</script>

<style scoped>
.asset-cover-image {
  width: 100%;
  height: 220px;
  object-fit: contain;
  border-radius: 6px;
  background: #f7f9fb;
}

.asset-cover-video-wrapper,
.asset-cover-audio-wrapper {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.asset-cover-audio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 220px;
  font-size: 64px;
  color: #409eff;
  border-radius: 6px;
  background: #f7f9fb;
}

.asset-cover-video-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
}

.asset-cover-video-mask:hover {
  transition: background-color .3s ease;
  background: rgba(0, 0, 0, 0.1);
}
</style>
