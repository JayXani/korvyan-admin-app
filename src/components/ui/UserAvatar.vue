<template>
  <div 
    class="user-avatar-comp" 
    :class="[sizeClass, { 'has-image': !!avatarUrl }]"
    :style="avatarStyle"
    :title="name"
  >
    <img 
      v-if="avatarUrl && !imageError" 
      :src="avatarUrl" 
      :alt="name || 'Avatar'" 
      class="avatar-img"
      @error="imageError = true"
    />
    <span v-else class="avatar-initials">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getUserAvatarViaWorker } from '@/services/workers.service'
import { getCurrentTenantPrefix } from '@/composables/useTenantContext'

const props = withDefaults(defineProps<{
  userId?: string
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'sm',
  name: ''
})

const imageError = ref(false)
const fbAvatar = ref('')
const avatarCache = new Map<string, string>()

const loadAvatar = async () => {
  if (!props.userId || props.src) return
  const tenant = getCurrentTenantPrefix()
  const cacheKey = `${tenant}_${props.userId}`

  if (avatarCache.has(cacheKey)) {
    fbAvatar.value = avatarCache.get(cacheKey) || ''
    return
  }

  try {
    const url = await getUserAvatarViaWorker(tenant, props.userId)
    if (url) {
      fbAvatar.value = url
      avatarCache.set(cacheKey, url)
    }
  } catch (e) {
    // silence error
  }
}

watch(() => props.userId, () => {
  if (props.userId && !props.src) {
    loadAvatar()
  }
})

onMounted(() => {
  if (props.userId && !props.src) {
    loadAvatar()
  }
})

const avatarUrl = computed(() => {
  return props.src || fbAvatar.value || ''
})

const initials = computed(() => {
  if (!props.name || props.name === '?') return 'U'
  const parts = props.name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const sizeClass = computed(() => `size-${props.size}`)

const avatarStyle = computed(() => {
  if (avatarUrl.value && !imageError.value) return {}
  // Gera uma cor sutil com base no nome para avatares sem foto
  let hash = 0
  const str = props.name || 'User'
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const goldHue = 43 // Matiz Dourado
  const sat = 50 + (Math.abs(hash) % 30)
  const light = 25 + (Math.abs(hash) % 15)
  return {
    background: `linear-gradient(135deg, hsl(${goldHue}, ${sat}%, ${light + 10}%), hsl(${goldHue}, ${sat}%, ${light}%))`,
    color: '#F3E5AB'
  }
})
</script>

<style scoped>
.user-avatar-comp {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
  border: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.user-avatar-comp:hover {
  border-color: var(--gold);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-initials {
  line-height: 1;
  letter-spacing: -0.5px;
}

/* Tamanhos Padronizados */
.size-xs { width: 24px; height: 24px; font-size: 0.65rem; }
.size-sm { width: 32px; height: 32px; font-size: 0.78rem; }
.size-md { width: 42px; height: 42px; font-size: 0.95rem; }
.size-lg { width: 54px; height: 54px; font-size: 1.15rem; }
.size-xl { width: 72px; height: 72px; font-size: 1.4rem; }
</style>
