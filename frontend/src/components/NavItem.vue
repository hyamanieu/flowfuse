<template>
    <li class="ff-nav-item">
        <div class="flex w-full justify-between items-center">
            <component v-if="icon" :is="icon" class="transition-fade--color" />
            <img v-if="avatar" :src="avatar" class="ff-avatar">
            <label class="transition-fade--color flex-grow">{{ label }}</label>
            <span v-if="featureUnavailable" data-el="premium-feature">
                <SparklesIcon class="transition-fade--color hollow" style="stroke-width: 1;" />
            </span>
        </div>
        <ff-notification-pill v-if="notifications > 0" :count="notifications" />
    </li>
</template>

<script>

import { SparklesIcon } from '@heroicons/vue/outline'

export default {
    name: 'NavItem',
    components: {
        SparklesIcon
    },
    props: {
        icon: {
            type: Function,
            default: () => null
        },
        avatar: {
            type: String,
            default: () => null
        },
        label: {
            type: String,
            required: true
        },
        featureUnavailable: {
            type: Boolean,
            default: false
        },
        notifications: {
            type: Number,
            default: () => 0
        }
    }
}
</script>
