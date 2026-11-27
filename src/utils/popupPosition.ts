export function popupPosition(event: MouseEvent) {
  if (event.detail !== 0) return { x: event.clientX, y: event.clientY }
  const button = (event.currentTarget as HTMLElement | null)?.getBoundingClientRect()
  return { x: button?.left ?? 0, y: button?.bottom ?? 0 }
}

export type PopupPosition = ReturnType<typeof popupPosition>
