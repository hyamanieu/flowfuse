<template>
    <div class="flex flex-col sm:flex-row">
        <SectionSideMenu :options="sideNavigation" />
        <div class="flex-grow">
            <router-view />
        </div>
    </div>
</template>

<script>
import SectionSideMenu from '../../components/SectionSideMenu.vue'
const sideNavigation = [
    { name: 'Password', path: '/account/security/password' },
    { name: 'Tokens', path: '/account/security/tokens' }
    // { name: "Sessions", path: "/account/security/sessions" }
]

export default {
    name: 'AccountSecurity',
    components: {
        SectionSideMenu
    },
    setup () {
        return {
            sideNavigation
        }
    }
}
</script>
