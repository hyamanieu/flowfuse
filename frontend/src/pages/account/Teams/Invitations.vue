<template>
    <div class="space-y-6">
        <ff-data-table data-el="table" :columns="inviteColumns" :rows="invitations">
            <template #context-menu="{row}">
                <ff-list-item data-action="accept" label="Accept" @click="acceptInvite(row)" />
                <ff-list-item data-action="reject" label="Reject" kind="danger" @click="rejectInvite(row)" />
            </template>
        </ff-data-table>
    </div>
</template>

<script>
import { markRaw } from 'vue'

import userApi from '../../../api/user.js'
import InviteUserCell from '../../../components/tables/cells/InviteUserCell.vue'
import TeamCell from '../../../components/tables/cells/TeamCell.vue'

export default {
    name: 'UserInviteTable',
    props: {
        user: {
            default: null,
            type: Object
        }
    },
    emits: ['invites-updated'],
    data () {
        return {
            invitations: [],
            inviteColumns: [
                { label: 'Team', key: 'team', class: ['w-auto'], component: { is: markRaw(TeamCell), map: { id: 'team.id', avatar: 'team.avatar', name: 'team.name' } } },
                { label: 'Role', class: ['w-40'], key: 'roleName' },
                { label: 'Sent by', key: 'invitor', class: ['w-auto'], component: { is: markRaw(InviteUserCell), map: { user: 'invitor' } } },
                { label: 'Expires In', key: 'expires', class: ['w-auto'] }
            ]
        }
    },
    mounted () {
        this.fetchData()
    },
    methods: {
        async acceptInvite (invite) {
            await userApi.acceptTeamInvitation(invite.id, invite.team.id)
            await this.fetchData()
            await this.$store.dispatch('account/refreshTeams')
            // navigate to team dashboad once invite accepted
            this.$router.push({
                name: 'Team',
                params: {
                    team_slug: invite.team.slug
                }
            })
        },
        async rejectInvite (invite) {
            await userApi.rejectTeamInvitation(invite.id, invite.team.id)
            await this.fetchData()
        },
        async fetchData () {
            const invitations = await userApi.getTeamInvitations()
            await this.$store.dispatch('account/countNotifications')
            this.invitations = invitations.invitations
        }
    }
}
</script>
