<template>
    <form class="space-y-6">
        <FormRow id="teamId" ref="id-row" v-model="teamId" type="uneditable">
            <template #default>Team ID</template>
        </FormRow>
        <FormRow id="teamName" ref="name-row" v-model="input.teamName" :type="editing ? 'text' : 'uneditable'" :error="errors.teamName">
            <template #default>Name</template>
            <template #description>
                <div v-if="editing">eg. 'Development'</div>
            </template>
        </FormRow>
        <FormRow v-model="input.teamType" type="uneditable">
            <template #default>Type</template>
            <template #description>
                <template v-if="editing">
                    Click <router-link :to="{name: 'TeamChangeType'}">here</router-link> to change the team type
                </template>
            </template>
        </FormRow>
        <FormRow id="teamSlug" v-model="input.slug" :type="editing ? 'text' : 'uneditable'" :error="errors.slug">
            <template #default>Slug</template>
            <template #description>
                <div v-if="editing">
                    <span class="text-red-700">Warning:</span>
                    Changing this will modify all urls used to access the team.
                    The platform will not redirect requests to the old url.
                    <br>
                    <br>
                    <pre>/team/&lt;slug&gt;</pre>
                </div>
            </template>
        </FormRow>

        <div class="space-x-4 whitespace-nowrap">
            <template v-if="!editing">
                <ff-button kind="primary" @click="editName">Edit team settings</ff-button>
            </template>
            <template v-else>
                <div class="flex gap-x-3">
                    <ff-button kind="secondary" @click="cancelEditName">Cancel</ff-button>
                    <ff-button kind="primary" :disabled="!formValid" @click="saveEditName">Save team settings</ff-button>
                </div>
            </template>
        </div>
    </form>
</template>

<script>

import teamApi from '../../../api/team.js'
import teamsApi from '../../../api/teams.js'
import FormRow from '../../../components/FormRow.vue'
import alerts from '../../../services/alerts.js'

export default {
    name: 'TeamSettingsGeneral',
    components: {
        FormRow
    },
    props: {
        team: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            errors: {
                teamName: '',
                slug: ''
            },
            editing: false,
            input: {
                slug: '',
                teamName: '',
                teamType: ''
            },
            pendingSlugCheck: null
        }
    },
    computed: {
        formValid () {
            return this.input.teamName && !this.pendingSlugCheck && !this.errors.slug && !this.errors.teamName
        },
        teamId () {
            return this.team.id
        },
        slugValid () {
            return /^[a-z0-9-_]+$/i.test(this.input.slug)
        }

    },
    watch: {
        team: 'fetchData',
        'input.slug': function (v) {
            if (!v) {
                this.errors.slug = 'Must not be blank'
            } else if (!/^[a-z0-9-_]+$/i.test(v)) {
                this.errors.slug = 'Must only contain a-z 0-9 - _'
            } else {
                this.checkSlug()
                this.errors.slug = ''
            }
        },
        'input.teamName': function (v) {
            if (v && /:\/\//.test(v)) {
                this.errors.teamName = 'Team name can not contain URL'
            } else {
                this.errors.teamName = ''
            }
        }
    },
    mounted () {
        this.fetchData()
    },
    methods: {
        editName () {
            this.editing = true
            this.$refs['name-row'].focus()
        },
        async saveEditName () {
            let changed = false
            const options = {}
            if (this.input.teamName !== this.team.name) {
                options.name = this.input.teamName
                changed = true
            }
            if (this.input.slug !== this.team.slug) {
                options.slug = this.input.slug
                changed = true
            }

            if (!changed) {
                this.cancelEditName()
                return
            }

            teamApi.updateTeam(this.team.id, options).then(async result => {
                this.editing = false
                await this.$store.dispatch('account/refreshTeams')
                await this.$store.dispatch('account/refreshTeam')
                alerts.emit('Team Settings updated.', 'confirmation')
            }).catch(err => {
                if (err.response.data) {
                    if (/slug/.test(err.response.data.error)) {
                        this.errors.slug = 'Slug already in use'
                    }
                }
            })
        },
        cancelEditName () {
            this.editing = false
            this.input.teamName = this.team.name
            this.input.slug = this.team.slug
            this.input.teamType = this.team.type.name
        },

        async fetchData () {
            this.cancelEditName()
        },
        checkSlug () {
            if (this.pendingSlugCheck) {
                clearTimeout(this.pendingSlugCheck)
            }
            this.pendingSlugCheck = setTimeout(() => {
                this.pendingSlugCheck = null
                if (this.input.slug && this.slugValid && this.input.slug !== this.team.slug) {
                    teamsApi.checkSlug(this.input.slug).then(() => {
                        if (this.slugValid) {
                            this.errors.slug = ''
                        }
                    }).catch(_ => {
                        if (this.slugValid) {
                            this.errors.slug = 'Slug unavailable'
                        }
                    })
                }
            }, 200)
        }
    }
}
</script>
