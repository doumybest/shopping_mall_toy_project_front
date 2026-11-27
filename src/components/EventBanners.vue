<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EventBanner } from '../types/api'

const props = defineProps<{ events: EventBanner[] }>()
const index = ref(0)
const current = computed(() => props.events[index.value])
let swipeStart = { x: 0, y: 0 }
let suppressClick = false
watch(() => props.events.length, count => { index.value = Math.min(index.value, Math.max(0, count - 1)) })

function move(direction: number) {
  index.value = (index.value + direction + props.events.length) % props.events.length
}

function finishSwipe(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (!touch || props.events.length < 2) return
  const distance = touch.clientX - swipeStart.x
  if (Math.abs(distance) < 50 || Math.abs(distance) <= Math.abs(touch.clientY - swipeStart.y)) return
  suppressClick = true
  move(distance < 0 ? 1 : -1)
}

function startSwipe(event: TouchEvent) {
  const touch = event.touches[0]
  if (touch) swipeStart = { x: touch.clientX, y: touch.clientY }
  suppressClick = false
}

function follow(event: MouseEvent) {
  if (suppressClick) event.preventDefault()
  suppressClick = false
}
</script>

<template>
  <section v-if="current" class="event-carousel" aria-label="開催中のイベント"
    @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)"
    @touchstart.passive="startSwipe"
    @touchend.passive="finishSwipe" @pointerdown="suppressClick = false">
    <Transition name="event-slide">
      <RouterLink :key="current.id" class="event-slide" :class="{ illustrated: current.hasImage }"
        :to="{ name: 'event', params: { id: current.id } }" @click="follow">
        <img v-if="current.hasImage" :src="`/api/events/${current.id}/image`" alt="" />
        <div class="event-copy">
          <h1>{{ current.title }}</h1>
          <p>{{ current.description }}</p>
          <span>イベント詳細を見る ↗</span>
        </div>
      </RouterLink>
    </Transition>
    <div v-if="events.length > 1" class="carousel-controls">
      <button type="button" aria-label="前のイベント" @click="move(-1)">‹</button>
      <span aria-live="polite">{{ index + 1 }} / {{ events.length }}</span>
      <button type="button" aria-label="次のイベント" @click="move(1)">›</button>
    </div>
  </section>
</template>

<style scoped>
.event-carousel { position: relative; overflow: hidden; border-radius: 12px; background: #edf0e6; touch-action: pan-y; }
.event-slide { position: relative; display: flex; min-height: 390px; align-items: center; padding: 46px 48px 68px; }
.event-slide:hover { filter: none; }
.event-slide:focus-visible { outline-offset: -4px; }
.event-slide img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.illustrated::after { position: absolute; inset: 0; content: ''; background: linear-gradient(90deg, #162e25e8, #162e2566 65%, transparent); }
.event-copy { position: relative; z-index: 1; max-width: min(540px, 100%); }
.event-copy h1 { font-size: 37px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.event-copy p { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.event-copy span { text-decoration: underline; text-underline-offset: 4px; }
.illustrated .event-copy { color: white; }
.carousel-controls { position: absolute; z-index: 2; bottom: 16px; right: 18px; display: flex; align-items: center; gap: 10px; background: #fdfcf9; border-radius: 24px; padding: 3px; }
.carousel-controls button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: #264b3f; color: white; font-size: 24px; line-height: 1; }
.event-slide-enter-active { transition: transform 200ms ease, opacity 200ms ease; }
.event-slide-leave-active { display: none; }
.event-slide-enter-from { transform: translateX(12px); opacity: 0; }
@media (max-width: 900px) { .event-slide { padding-inline: 35px; } .event-copy h1 { font-size: 31px; } }
@media (max-width: 650px) { .event-slide { min-height: 230px; padding: 30px 24px 62px; } .event-copy h1 { font-size: 24px; } }
@media (prefers-reduced-motion: reduce) { .event-slide-enter-active { transition: none; } }
</style>
