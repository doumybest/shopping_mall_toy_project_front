<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { PopupPosition } from '../utils/popupPosition'

const props = defineProps<{ feedback: PopupPosition & { message: string; cart?: boolean; failure?: boolean } }>()
defineEmits<{ close: [] }>()
const panel = ref<HTMLElement>()
const location = ref({ left: '8px', top: '8px', visibility: 'hidden' as const } as Record<string, string>)

function position() {
  const size = panel.value?.getBoundingClientRect()
  if (!size) return
  location.value = {
    left: `${Math.max(8, Math.min(props.feedback.x + 10, window.innerWidth - size.width - 8))}px`,
    top: `${Math.max(8, Math.min(props.feedback.y + 10, window.innerHeight - size.height - 8))}px`,
  }
}
onMounted(() => { position(); window.addEventListener('resize', position) })
onUnmounted(() => window.removeEventListener('resize', position))
</script>

<template>
  <aside ref="panel" class="action-popup" :class="{ failure: feedback.failure }" :style="location"
    aria-label="操作のお知らせ" @keydown.esc="$emit('close')">
    <span :role="feedback.failure ? 'alert' : 'status'">{{ feedback.message }}</span>
    <RouterLink v-if="feedback.cart" class="secondary" :to="{ name: 'cart' }" @click="$emit('close')">カートを見る</RouterLink>
    <button type="button" class="text-button" aria-label="ポップアップを閉じる" @click="$emit('close')">×</button>
  </aside>
</template>

<style scoped>
.action-popup { position: fixed; z-index: 30; display: flex; flex-wrap: wrap; align-items: center; gap: 9px;
  max-width: min(320px, calc(100vw - 16px)); padding: 10px 12px; border: 1px solid #c9d7c4;
  border-radius: 8px; background: #f3f7ef; box-shadow: 0 5px 20px #182a2226; }
.action-popup.failure { background: #fcece6; border-color: #eed2c7; }
.action-popup .text-button { padding: 0 3px; margin-left: auto; font-size: 18px; }
</style>
