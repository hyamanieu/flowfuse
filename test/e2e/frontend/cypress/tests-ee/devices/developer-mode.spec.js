describe('FlowForge - Devices - With Billing', () => {
    beforeEach(() => {
        cy.enableBilling()
        cy.intercept('/api/*/settings', (req) => {
            req.reply((response) => {
                // ensure we keep billing enabled
                response.body.features.billing = true
                // fake MQTT connection
                response.body.features.deviceEditor = true
                return response
            })
        }).as('getSettings')

        cy.login('bob', 'bbPassword')

        cy.visit('/team/bteam/devices')
    })

    it('provides an option to enable "Developer Mode" when deviceEditor feature is enabled', () => {
        cy.contains('span', 'application-device-a').click()
        cy.get('[data-el=device-devmode-toggle]').should('exist')
    })

    it('has "Developer Mode" tab and status pill when Dev mode is enabled', () => {
        cy.contains('span', 'application-device-a').click()
        cy.get('[data-nav="device-devmode"]').should('not.exist')
        cy.get('[data-el="badge-devmode"]').should('not.exist')
        cy.get('[data-el=device-devmode-toggle]').click()
        cy.get('[data-nav="device-devmode"]').should('exist')
        cy.get('[data-el="badge-devmode"]').should('exist')

        // reset dev mode state
        cy.get('[data-el=device-devmode-toggle]').click()
    })

    it('is redirected away from the Developer Mode tab if leaving that mode, whilst the tab is open', () => {
        cy.contains('span', 'application-device-a').click()
        cy.get('[data-el=device-devmode-toggle]').click()
        cy.get('[data-nav="device-devmode"]').click()

        cy.url().should('include', '/developer-mode')

        // reset dev mode state
        cy.get('[data-el=device-devmode-toggle]').click()

        cy.url().should('not.include', '/developer-mode')
    })
})
