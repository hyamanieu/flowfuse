<template>
    <div class="flex flex-col sm:flex-row">
        <SectionSideMenu :options="sideNavigation" />
        <div class="flex-grow">
            <router-view :device="device" @device-updated="$emit('device-updated')" @assign-device="$emit('assign-device')" />
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { mapState } from 'vuex'

import SectionSideMenu from '../../../components/SectionSideMenu.vue'

import permissionsMixin from '../../../mixins/Permissions.js'

export default {
    name: 'DeviceSettins',
    props: ['device'],
    emits: ['device-updated', 'assign-device'],
    mixins: [permissionsMixin],
    data: function () {
        return {
            sideNavigation: []
        }
    },
    computed: {
        ...mapState('account', ['teamMembership', 'team'])
    },
    mounted () {
        this.checkAccess()
    },
    methods: {
        checkAccess: async function () {
            if (!this.teamMembership) {
                useRouter().push({ replace: true, path: 'overview' })
                return
            }
            this.sideNavigation = [
                { name: 'General', path: './general' },
                { name: 'Environment', path: './environment' }
            ]
            if (this.hasPermission('device:edit')) {
                this.sideNavigation.push({ name: 'Danger', path: './danger' })
            }
        }
    },
    components: {
        SectionSideMenu
    }
}
</script>
