<template>
    <ff-button
        v-if="!isVisitingAdmin"
        v-ff-tooltip:left="disabledReason"
        kind="secondary"
        data-action="open-editor"
        :disabled="editorDisabled || disabled || !url"
        @click.stop="openEditor()"
    >
        <template #icon-right>
            <ExternalLinkIcon />
        </template>
        {{ editorDisabled ? 'Editor Disabled' : 'Open Editor' }}
    </ff-button>
    <button v-else v-ff-tooltip:left="'Unable to open editor when visiting as an admin'" class="ff-btn ff-btn--secondary" disabled>
        {{ editorDisabled ? 'Editor Disabled' : 'Open Editor' }}
        <span class="ff-btn--icon ff-btn--icon-right">
            <ExternalLinkIcon />
        </span>
    </button>
</template>

<script>
import { ExternalLinkIcon } from '@heroicons/vue/solid'

import { mapState } from 'vuex'

import { Roles } from '../../../../../forge/lib/roles.js'

export default {
    name: 'InstanceEditorLink',
    components: { ExternalLinkIcon },
    inheritAttrs: false,
    props: {
        editorDisabled: {
            default: false,
            type: Boolean
        },
        disabled: {
            default: false,
            type: Boolean
        },
        disabledReason: {
            default: null,
            type: String
        },
        url: {
            default: '',
            type: String
        }
    },
    computed: {
        ...mapState('account', ['team', 'teamMembership']),
        isVisitingAdmin () {
            return this.teamMembership.role === Roles.Admin
        }
    },
    methods: {
        openEditor () {
            if (this.disabled) {
                return
            }

            window.open(this.url, '_blank')
        }
    }
}
</script>
