<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard v-if="isDevModeAvailable" header="Developer Mode Options:">
            <template #icon>
                <BeakerIcon />
            </template>
            <template #content>
                <InfoCardRow property="Editor Access:">
                    <template #value>
                        <div class="flex gap-9 items-center">
                            <div class="font-medium forge-badge" :class="'forge-status-' + (editorEnabled ? (editorTunnelConnected ? 'running' : 'error') : 'stopped')">
                                <span v-if="editorEnabled">
                                    <span v-if="editorTunnelConnected">enabled</span>
                                    <span v-else>not connected</span>
                                </span>
                                <span v-else>disabled</span>
                            </div>
                            <div class="space-x-2 flex align-center">
                                <ff-button
                                    v-if="editorEnabled"
                                    :disabled="!editorCanBeEnabled || closingTunnel || !editorEnabled"
                                    kind="primary"
                                    size="small"
                                    @click="closeTunnel"
                                >
                                    <span v-if="closingTunnel">Disabling...</span>
                                    <span v-else>Disable</span>
                                </ff-button>
                                <ff-button
                                    v-if="!editorEnabled"
                                    :disabled="!editorCanBeEnabled || openingTunnel || editorEnabled"
                                    kind="danger"
                                    size="small"
                                    @click="openTunnel"
                                >
                                    <span v-if="openingTunnel">Enabling...</span>
                                    <span v-else>Enable</span>
                                </ff-button>
                            </div>
                        </div>
                    </template>
                </InfoCardRow>
                <InfoCardRow property="Device Flows:">
                    <template #value>
                        <ff-button
                            kind="secondary"
                            class="w-28 whitespace-nowrap"
                            size="small"
                            @click="showCreateSnapshotDialog"
                        >
                            Create Snapshot
                        </ff-button>
                    </template>
                </InfoCardRow>
            </template>
        </InfoCard>
        <SnapshotCreateDialog ref="snapshotCreateDialog" data-el="dialog-create-device-snapshot" :device="device" :show-set-as-target="true" @device-upload-success="onSnapshotCreated" @device-upload-failed="onSnapshotFailed" @canceled="onSnapshotCancel" />
    </div>
</template>

<script>
import { BeakerIcon } from '@heroicons/vue/outline'
import semver from 'semver'
import { mapState } from 'vuex'

import deviceApi from '../../../api/devices.js'

// components
import InfoCard from '../../../components/InfoCard.vue'
import InfoCardRow from '../../../components/InfoCardRow.vue'
import alerts from '../../../services/alerts.js'
import SnapshotCreateDialog from '../dialogs/SnapshotCreateDialog.vue'

export default {
    name: 'DeviceDeveloperMode',
    components: {
        BeakerIcon,
        InfoCard,
        InfoCardRow,
        SnapshotCreateDialog
    },
    props: {
        device: {
            type: Object,
            required: true
        }
    },
    emits: ['device-updated'],
    data () {
        return {
            agentSupportsDeviceAccess: false,
            busy: false,
            openingTunnel: false,
            closingTunnel: false
        }
    },
    computed: {
        ...mapState('account', ['features']),
        developerMode: function () {
            return this.device?.mode === 'developer'
        },
        isDevModeAvailable: function () {
            return !!this.features.deviceEditor
        },
        editorEnabled: function () {
            return !!this.device?.editor?.enabled
        },
        editorTunnelConnected: function () {
            return !!this.device?.editor?.connected
        },
        editorCanBeEnabled: function () {
            return this.developerMode && this.device.status === 'running'
        }
    },
    watch: {
        'device.mode': function () {
            if (this.device.mode !== 'developer') {
                this.redirect()
            }
        }
    },
    mounted () {
        this.agentSupportsDeviceAccess = this.device?.agentVersion && semver.gt(this.device.agentVersion, '0.6.1')
        // check developer mode enabled
        if (this.device && this.device.mode !== 'developer') {
            this.redirect()
        }
    },
    methods: {
        redirect () {
            this.$router.push({ name: 'Device', params: { id: this.device.id } })
        },
        async openTunnel () {
            if (this.device.status === 'running') {
                this.openingTunnel = true
                try {
                    // * Enable Device Editor (Step 1) - (browser->frontendApi) User clicks button to "Enable Editor"
                    const result = await deviceApi.enableEditorTunnel(this.device.id)
                    this.updateTunnelStatus(result)
                    setTimeout(() => {
                        this.$emit('device-updated')
                    }, 500)
                } finally {
                    this.openingTunnel = false
                }
            } else {
                alerts.emit('The device must be in "running" state to access the editor', 'warning', 7500)
            }
        },
        async closeTunnel () {
            this.closingTunnel = true
            try {
                const result = await deviceApi.disableEditorTunnel(this.device.id)
                this.updateTunnelStatus(result)
                this.$emit('device-updated')
            } finally {
                this.closingTunnel = false
            }
        },
        showCreateSnapshotDialog () {
            this.busy = true
            this.$refs.snapshotCreateDialog.show()
        },
        async onSnapshotCreated (snapshot) {
            alerts.emit('Successfully created snapshot from the device.', 'confirmation')
            this.busy = false
        },
        onSnapshotCancel () {
            this.busy = false
        },
        async onSnapshotFailed (err) {
            console.error(err.response?.data)
            if (err.response?.data) {
                if (/name/.test(err.response.data.error)) {
                    this.errors.name = err.response.data.error
                    return
                }
            }
            alerts.emit('Failed to create snapshot from the device.', 'warning')
            this.busy = false
        },
        updateTunnelStatus (status) {
            // TODO: this is a hack to get the tunnel URL into the device object
            //       so that the editor can use it.  This should be refactored
            //       to use a Vuex store or something.
            // eslint-disable-next-line vue/no-mutating-props
            this.device.editor = this.device.editor || {}
            // eslint-disable-next-line vue/no-mutating-props
            this.device.editor.url = status.url
            // eslint-disable-next-line vue/no-mutating-props
            this.device.editor.enabled = !!status.enabled
            // eslint-disable-next-line vue/no-mutating-props
            this.device.editor.connected = !!status.connected
            // use the tunnel-changed event to notify the parent component
        }
    }
}
</script>
