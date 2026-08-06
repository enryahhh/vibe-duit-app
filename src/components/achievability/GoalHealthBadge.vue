<script setup lang="ts">
import { computed } from "vue";
import type { HealthStatus } from "@/types/achievability";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-vue-next";

const props = defineProps<{
  status: HealthStatus;
  showIcon?: boolean;
}>();

const label = computed(() => {
  switch (props.status) {
    case "on_track":
      return "On Track";
    case "at_risk":
      return "At Risk";
    case "off_track":
      return "Off Track";
    case "uncertain":
      return "Need More Data";
    default:
      return "Uncertain";
  }
});

const statusClass = computed(() => {
  switch (props.status) {
    case "on_track":
      return "status-on-track";
    case "at_risk":
      return "status-at-risk";
    case "off_track":
      return "status-off-track";
    case "uncertain":
      return "status-uncertain";
    default:
      return "status-uncertain";
  }
});
</script>

<template>
  <span class="health-badge" :class="statusClass">
    <template v-if="showIcon !== false">
      <CheckCircle2 v-if="status === 'on_track'" :size="12" />
      <AlertTriangle v-else-if="status === 'at_risk'" :size="12" />
      <XCircle v-else-if="status === 'off_track'" :size="12" />
      <HelpCircle v-else :size="12" />
    </template>
    <span>{{ label }}</span>
  </span>
</template>

<style scoped>
.health-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.status-on-track {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-at-risk {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-off-track {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-uncertain {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}
</style>
