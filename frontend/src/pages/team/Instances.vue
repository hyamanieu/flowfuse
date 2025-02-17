<template>
    <ff-page>
        <template #header>
            <ff-page-header title="Instances">
                <template #context>
                    A list of all Node-RED instances belonging to this Team.
                </template>
                <template #help-header>
                    Instances
                </template>
                <template #helptext>
                    <p>
                        This is a list of all Node-RED instances belonging to this team running
                        in this FlowFuse.
                    </p>
                    <p>
                        Each Instance is a customised version of Node-RED that includes various
                        FlowFuse plugins to integrate it with the platform.
                    </p>
                    <p>
                        A number of the standard Node-RED settings are exposed for customisation,
                        and they can be preset by applying a Template upon creation of an Instance.
                    </p>
                </template>
            </ff-page-header>
        </template>
        <div class="space-y-6">
            <ff-loading v-if="loading" message="Loading Instances..." />
            <template v-else>
                <ff-data-table
                    v-if="instances.length > 0"
                    data-el="instances-table" :columns="columns" :rows="instances" :show-search="true" search-placeholder="Search Instances..."
                    :rows-selectable="true" @row-selected="openInstance"
                >
                    <template #actions>
                        <ff-button
                            v-if="hasPermission('project:create')"
                            data-action="create-project"
                            kind="primary"
                            :to="{name: 'CreateInstance'}"
                        >
                            <template #icon-left>
                                <PlusSmIcon />
                            </template>
                            Create Instance
                        </ff-button>
                    </template>
                </ff-data-table>
                <EmptyState v-else>
                    <template #img>
                        <img src="../../images/empty-states/team-instances.png">
                    </template>
                    <template #header>Get Started with your First Node-RED Instance</template>
                    <template #message>
                        <p>
                            Instances are managed in FlowFuse via <router-link
                                class="ff-link"
                                :to="{name:'Applications', params: {team_slug: team.slug}}"
                            >
                                Applications
                            </router-link>.
                        </p>
                        <p>
                            You can create your first Instance when creating your first Application, or add an Instance to an existing Application if you have one.
                        </p>
                    </template>
                    <template #actions>
                        <ff-button
                            v-if="hasPermission('project:create')"
                            kind="primary"
                            :to="{name: 'CreateInstance'}"
                        >
                            <template #icon-left>
                                <PlusSmIcon />
                            </template>
                            Create Instance
                        </ff-button>
                    </template>
                </EmptyState>
            </template>
        </div>
    </ff-page>
</template>

<script>
import { PlusSmIcon } from '@heroicons/vue/outline'
import { markRaw } from 'vue'

import teamApi from '../../api/team.js'
import EmptyState from '../../components/EmptyState.vue'
import permissionsMixin from '../../mixins/Permissions.js'
import InstanceStatusBadge from '../instance/components/InstanceStatusBadge.vue'

export default {
    name: 'TeamInstances',
    components: {
        PlusSmIcon,
        EmptyState
    },
    mixins: [permissionsMixin],
    props: {
        team: {
            type: Object,
            required: true
        },
        teamMembership: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            loading: false,
            instances: [],
            columns: [
                { label: 'Name', class: ['flex-grow'], key: 'name', sortable: true },
                { label: 'Status', class: ['w-44'], key: 'status', sortable: true, component: { is: markRaw(InstanceStatusBadge) } },
                { label: 'Last Updated', class: ['w-60'], key: 'flowLastUpdatedSince', sortable: true },
                { label: 'Application', class: ['flex-grow-[0.25]'], key: 'application.name', sortable: true }
            ]
        }
    },
    watch: {
        team: 'fetchData'
    },
    mounted () {
        this.fetchData()
    },
    methods: {
        fetchData: async function (newVal) {
            this.loading = true
            if (this.team.id) {
                this.instances = (await teamApi.getTeamInstances(this.team.id)).projects
            }
            this.loading = false
        },
        openInstance (instance) {
            this.$router.push({
                name: 'Instance',
                params: {
                    id: instance.id
                }
            })
        }
    }
}
</script>
