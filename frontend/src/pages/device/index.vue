<template>
    <Teleport v-if="mounted" to="#platform-sidenav">
        <SideNavigationTeamOptions />
    </Teleport>
    <main v-if="device" class="ff-with-status-header">
        <Teleport v-if="mounted" to="#platform-banner">
            <SubscriptionExpiredBanner :team="team" />
            <TeamTrialBanner v-if="team.billing?.trial" :team="team" />
        </Teleport>
        <div class="ff-instance-header">
            <SectionNavigationHeader :tabs="navigation">
                <template #breadcrumbs>
                    <ff-nav-breadcrumb :to="{name: 'TeamDevices', params: {team_slug: team.slug}}">Devices</ff-nav-breadcrumb>
                    <ff-nav-breadcrumb>{{ device.name }}</ff-nav-breadcrumb>
                </template>
                <template #status>
                    <div class="space-x-6">
                        <DeviceLastSeenBadge :last-seen-at="device.lastSeenAt" :last-seen-ms="device.lastSeenMs" :last-seen-since="device.lastSeenSince" />
                        <StatusBadge :status="device.status" />
                        <DeveloperModeBadge v-if="isDevModeAvailable && device.mode === 'developer'" />
                    </div>
                </template>
                <template #context>
                    <div v-if="device?.ownerType === 'application' && device.application" data-el="device-assigned-application">
                        Application:
                        <router-link :to="{name: 'Application', params: {id: device.application.id}}" class="text-blue-600 cursor-pointer hover:text-blue-700 hover:underline">{{ device.application.name }}</router-link>
                    </div>
                    <div v-else-if="device?.ownerType === 'instance' && device.instance" data-el="device-assigned-instance">
                        Instance:
                        <router-link :to="{name: 'Instance', params: {id: device.instance.id}}" class="text-blue-600 cursor-pointer hover:text-blue-700 hover:underline">{{ device.instance.name }}</router-link>
                    </div>
                    <div v-else data-el="device-assigned-none">
                        <span class="italic">No Application or Instance Assigned</span> - <a class="ff-link" data-action="assign-device" @click="openAssignmentDialog">Assign</a>
                    </div>
                </template>
                <template v-if="isDevModeAvailable" #tools>
                    <div class="space-x-2 flex align-center">
                        <a v-if="editorAvailable && !isVisitingAdmin" class="ff-btn ff-btn--secondary" :href="deviceEditorURL" :target="`device-editor-${device.id}`" data-action="device-editor">
                            Device Editor
                            <span class="ff-btn--icon ff-btn--icon-right">
                                <ExternalLinkIcon />
                            </span>
                        </a>
                        <button v-else v-ff-tooltip:left="developerMode ? 'Please enable \'Editor Access\' in the \'Developer Mode\' tab' : '\'Developer Mode\' must be enabled'" data-action="open-editor" class="ff-btn ff-btn--secondary" disabled>
                            Editor Disabled
                            <span class="ff-btn--icon ff-btn--icon-right">
                                <ExternalLinkIcon />
                            </span>
                        </button>
                        <DeveloperModeToggle data-el="device-devmode-toggle" :device="device" @mode-change="setDeviceMode" />
                    </div>
                </template>
            </SectionNavigationHeader>
        </div>
        <div class="sm:px-6 mt-4 sm:mt-8">
            <Teleport v-if="mounted && isVisitingAdmin" to="#platform-banner">
                <div class="ff-banner" data-el="banner-device-as-admin">You are viewing this device as an Administrator</div>
            </Teleport>
            <div class="px-3 pb-3 md:px-6 md:pb-6">
                <router-view :instance="device.instance" :device="device" @device-updated="loadDevice()" @device-refresh="loadDevice()" @assign-device="openAssignmentDialog" />
            </div>
        </div>
        <!-- Dialogs -->
        <AssignDeviceDialog
            v-if="notAssigned"
            ref="assignment-dialog"
            data-el="assignment-dialog"
            @assign-option-selected="assignOptionSelected"
        />
        <DeviceAssignInstanceDialog
            v-if="notAssigned"
            ref="deviceAssignInstanceDialog"
            data-el="assignment-dialog-instance"
            @assign-device="assignDeviceToInstance"
        />
        <DeviceAssignApplicationDialog
            v-if="notAssigned"
            ref="deviceAssignApplicationDialog"
            data-el="assignment-dialog-application"
            @assign-device="assignDeviceToApplication"
        />
    </main>
</template>

<script>

import { ExternalLinkIcon } from '@heroicons/vue/outline'
import { TerminalIcon } from '@heroicons/vue/solid'
import semver from 'semver'
import { mapState } from 'vuex'

import { Roles } from '../../../../forge/lib/roles.js'
import deviceApi from '../../api/devices.js'
import SectionNavigationHeader from '../../components/SectionNavigationHeader.vue'
import SideNavigationTeamOptions from '../../components/SideNavigationTeamOptions.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import SubscriptionExpiredBanner from '../../components/banners/SubscriptionExpired.vue'
import TeamTrialBanner from '../../components/banners/TeamTrial.vue'
import permissionsMixin from '../../mixins/Permissions.js'
import Alerts from '../../services/alerts.js'

import DeviceAssignApplicationDialog from '../team/Devices/dialogs/DeviceAssignApplicationDialog.vue'
import DeviceAssignInstanceDialog from '../team/Devices/dialogs/DeviceAssignInstanceDialog.vue'

import AssignDeviceDialog from './components/AssignDeviceDialog.vue'

import DeveloperModeBadge from './components/DeveloperModeBadge.vue'
import DeveloperModeToggle from './components/DeveloperModeToggle.vue'
import DeviceLastSeenBadge from './components/DeviceLastSeenBadge.vue'

export default {
    name: 'DevicePage',
    components: {
        ExternalLinkIcon,
        DeveloperModeToggle,
        DeveloperModeBadge,
        DeviceLastSeenBadge,
        SectionNavigationHeader,
        SideNavigationTeamOptions,
        StatusBadge,
        SubscriptionExpiredBanner,
        TeamTrialBanner,
        AssignDeviceDialog,
        DeviceAssignApplicationDialog,
        DeviceAssignInstanceDialog
    },
    mixins: [permissionsMixin],
    data: function () {
        return {
            mounted: false,
            device: null,
            agentSupportsDeviceAccess: false
        }
    },
    computed: {
        ...mapState('account', ['teamMembership', 'team', 'features', 'settings']),
        isVisitingAdmin: function () {
            // return true
            return this.teamMembership.role === Roles.Admin
        },
        isDevModeAvailable: function () {
            return !!this.features.deviceEditor
        },
        developerMode: function () {
            return this.device && this.agentSupportsDeviceAccess && this.device.mode === 'developer'
        },
        editorAvailable: function () {
            return this.isDevModeAvailable &&
                this.device &&
                this.agentSupportsDeviceAccess &&
                this.developerMode &&
                this.device.status === 'running' &&
                this.deviceEditorURL &&
                this.device.editor?.connected
        },
        deviceEditorURL: function () {
            return this.device.editor?.url || ''
        },
        notAssigned () {
            const device = this.device
            const hasApplication = device?.ownerType === 'application' && device.application
            const hasInstance = device?.ownerType === 'instance' && device.instance
            return !hasApplication && !hasInstance
        },
        navigation () {
            const navigation = [
                { label: 'Overview', to: `/device/${this.$route.params.id}/overview`, tag: 'device-overview' }
            ]

            // snapshots - if device is owned by an application,
            if (this.device?.ownerType !== 'instance') {
                navigation.push({
                    label: 'Snapshots',
                    to: `/device/${this.$route.params.id}/snapshots`,
                    tag: 'device-snapshots'
                })
            }

            // device logs - if project comms is enabled,
            if (this.features.projectComms) {
                navigation.push({
                    label: 'Device Logs',
                    to: `/device/${this.$route.params.id}/logs`,
                    tag: 'device-logs',
                    icon: TerminalIcon
                })
            }

            // settings - always
            navigation.push({ label: 'Settings', to: `/device/${this.$route.params.id}/settings`, tag: 'device-settings' })

            // developer mode - if available and device is in developer mode
            if (this.isDevModeAvailable && this.device.mode === 'developer') {
                navigation.push({
                    label: 'Developer Mode',
                    to: `/device/${this.$route.params.id}/developer-mode`,
                    tag: 'device-devmode'
                })
            }

            return navigation
        }
    },
    async mounted () {
        this.mounted = true
        await this.loadDevice()
    },
    methods: {
        loadDevice: async function () {
            this.device = await deviceApi.getDevice(this.$route.params.id)
            this.agentSupportsDeviceAccess = this.device.agentVersion && semver.gte(this.device.agentVersion, '0.8.0')
            this.$store.dispatch('account/setTeam', this.device.team.slug)
        },
        showOpenEditorDialog: async function () {
            this.$refs['open-editor-dialog'].show()
        },
        setDeviceMode: async function (newMode, callback) {
            try {
                if (newMode !== 'autonomous' && newMode !== 'developer') {
                    throw new Error('Unsupported mode')
                }
                // call to close tunnel regardless of selected mode being set
                const disableResult = await deviceApi.disableEditorTunnel(this.device.id)
                // set the selected mode
                const setModeResult = await deviceApi.setMode(this.device.id, newMode)
                // update the device properties to reflect immediate status
                this.device.editor = {
                    enabled: !!disableResult?.editor?.enabled,
                    connected: !!disableResult?.editor?.connected,
                    url: disableResult?.editor?.url
                }
                this.device.mode = setModeResult?.mode
                callback(null, setModeResult)
            } catch (error) {
                if (callback) {
                    callback(error)
                } else {
                    throw new Error('Unknown mode')
                }
            }
        },
        openAssignmentDialog () {
            this.$refs['assignment-dialog'].show()
        },
        assignOptionSelected (option) {
            if (option === 'instance') {
                this.$refs.deviceAssignInstanceDialog.show(this.device)
            } else if (option === 'application') {
                this.$refs.deviceAssignApplicationDialog.show(this.device)
            }
        },
        async assignDeviceToInstance (device, instanceId) {
            this.device = await deviceApi.updateDevice(device.id, { instance: instanceId })

            Alerts.emit('Device successfully assigned to instance.', 'confirmation')
        },

        async assignDeviceToApplication (device, applicationId) {
            this.device = await deviceApi.updateDevice(device.id, { application: applicationId, instance: null })

            Alerts.emit('Device successfully assigned to application.', 'confirmation')
        }
    }
}
</script>
