<template>
    <div>
        <div class="mb-3">
            <SectionTopMenu hero="Snapshots" help-header="FlowFuse - Snapshots" info="A list of all snapshots generated by any Instance or Device within this Application.">
                <template #helptext>
                    <p>Snapshots generate a point-in-time backup of your Node-RED flow, credentials and runtime settings.</p>
                    <p>Snapshots are also required for deploying to devices. In the Deployments page of a Project, you can define your “Target Snapshot”, which will then be deployed to all connected devices.</p>
                    <p>You can also generate Snapshots directly from any instance of Node-RED using the <a target="_blank" href="https://github.com/FlowFuse/flowforge-nr-tools-plugin">FlowFuse NR Tools Plugin.</a></p>
                </template>
            </SectionTopMenu>
        </div>
        <ff-loading v-if="loading" message="Loading Snapshots..." />
        <template v-if="snapshots.length > 0">
            <ff-data-table data-el="snapshots" class="space-y-4" :columns="columns" :rows="snapshots" :show-search="true" search-placeholder="Search Snapshots..." />
        </template>
        <template v-else-if="!loading">
            <EmptyState>
                <template #img>
                    <img src="../../images/empty-states/instance-snapshots.png">
                </template>
                <template #header>What are Snapshots?</template>
                <template #message>
                    <p>
                        Snapshots are point-in-time backups of your Node-RED Instances & Devices.
                    </p>
                    <p>
                        They capture the flows, credentials and runtime settings, and can
                        be pushed & deployed from one Instance/Device to any other, or
                        used to rollback an Instance to a point in history.
                    </p>
                </template>
            </EmptyState>
        </template>
    </div>
</template>

<script>
import { markRaw } from 'vue'

import ApplicationApi from '../../api/application.js'

import EmptyState from '../../components/EmptyState.vue'
import SectionTopMenu from '../../components/SectionTopMenu.vue'
import UserCell from '../../components/tables/cells/UserCell.vue'
import permissionsMixin from '../../mixins/Permissions.js'

// Table Cells
import DaysSince from './Snapshots/components/cells/DaysSince.vue'
import SnapshotName from './Snapshots/components/cells/SnapshotName.vue'
import SnapshotSource from './Snapshots/components/cells/SnapshotSource.vue'

export default {
    name: 'ApplicationSnapshots',
    components: {
        SectionTopMenu,
        EmptyState
    },
    mixins: [permissionsMixin],
    props: {
        application: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            loading: false,
            snapshots: [],
            columns: [
                {
                    label: 'Snapshot',
                    class: ['w-56 sm:w-48'],
                    component: {
                        is: markRaw(SnapshotName)
                    }
                },
                {
                    label: 'Source',
                    class: ['w-56'],
                    key: '_ownerSortKey',
                    component: {
                        is: markRaw(SnapshotSource)
                    }
                },
                {
                    label: 'Created By',
                    class: ['w-48 hidden md:table-cell'],
                    component: {
                        is: markRaw(UserCell),
                        map: {
                            avatar: 'user.avatar',
                            name: 'user.name',
                            username: 'user.username'
                        }
                    }
                },
                {
                    label: 'Date Created',
                    class: ['w-48 hidden sm:table-cell'],
                    component: { is: markRaw(DaysSince), map: { date: 'createdAt' } }
                }
            ]
        }
    },
    mounted () {
        this.loadSnapshots()
    },
    methods: {
        loadSnapshots: async function () {
            this.loading = true
            const data = await ApplicationApi.getSnapshots(this.application.id, null, null, null)
            this.snapshots = [...data.snapshots]
            this.loading = false
        }
    }
}
</script>
