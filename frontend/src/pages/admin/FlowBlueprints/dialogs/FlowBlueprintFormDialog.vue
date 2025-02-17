<template>
    <ff-dialog ref="dialog" :header="dialogTitle">
        <template #default>
            <form class="space-y-6 mt-2" @submit.prevent>
                <div v-if="error" data-el="form-row-error" class="ml-4 text-red-400 text-xs">{{ error }}</div>

                <FormRow v-model="input.name" :error="errors.name" data-form="name">Name</FormRow>
                <FormRow v-model="input.active" type="checkbox" data-form="active">Active</FormRow>
                <FormRow v-model="input.category" :error="errors.category" data-form="category">
                    Category
                    <template #description>Freeform (case-sensitive) category</template>
                </FormRow>
                <FormRow v-model="input.description" :error="errors.description" data-form="description">
                    Description
                    <template #description>Use markdown for formatting</template>
                    <template #input><textarea v-model="input.description" class="w-full" rows="4" /></template>
                </FormRow>

                <FormRow v-model="input.flows" :error="errors.flows" data-form="modules">
                    Flows
                    <template #description>JSON representation of the flows for this template</template>
                    <template #input><textarea v-model="input.flows" class="w-full" rows="4" /></template>
                </FormRow>

                <FormRow v-model="input.modules" :error="errors.modules" data-form="modules">
                    Modules
                    <template #description>JSON representation of the npm modules required for this template</template>
                    <template #input><textarea v-model="input.modules" class="w-full" rows="4" /></template>
                </FormRow>
            </form>
        </template>
        <template #actions>
            <div class="w-full grow flex justify-between">
                <div>
                    <ff-button v-if="flowBlueprint?.id" kind="danger" style="margin: 0;" @click="$emit('show-delete-dialog', flowBlueprint); $refs.dialog.close()">Delete Flow Blueprint</ff-button>
                </div>
                <div class="flex">
                    <ff-button kind="secondary" @click="$refs['dialog'].close()">Cancel</ff-button>
                    <ff-button :disabled="!formValid" @click="confirm">{{ flowBlueprint?.id ? 'Update' : 'Create' }}</ff-button>
                </div>
            </div>
        </template>
    </ff-dialog>
</template>

<script>
import FlowBlueprintsApi from '../../../../api/flowBlueprints.js'

import FormRow from '../../../../components/FormRow.vue'

export default {
    name: 'AdminFlowBlueprintForm',
    components: {
        FormRow
    },
    emits: ['show-delete-dialog', 'flow-blueprint-created', 'flow-blueprint-updated'],
    setup () {
        return {
            show (flowBlueprint) {
                this.$refs.dialog.show()
                this.flowBlueprint = flowBlueprint
                this.input = {
                    name: flowBlueprint?.name ?? '',
                    active: flowBlueprint?.active ?? true,
                    category: flowBlueprint?.category ?? '',
                    description: flowBlueprint?.description ?? '',

                    flows: flowBlueprint?.flows ? JSON.stringify(flowBlueprint.flows) : '',
                    modules: flowBlueprint?.modules ? JSON.stringify(flowBlueprint.modules) : ''
                }
                this.errors = {}
                this.error = null
            }
        }
    },
    data () {
        return {
            flowBlueprint: null,
            input: {
                name: '',
                active: true,
                description: '',
                properties: {},
                defaultStack: ''
            },
            errors: {},
            error: null
        }
    },
    computed: {
        formValid () {
            return (this.input.name)
        },
        dialogTitle () {
            return this.flowBlueprint?.id ? 'Edit Flow Blueprint' : 'Create Flow Blueprint'
        }
    },
    methods: {
        async confirm () {
            if (!this.formValid) {
                return
            }

            const flowBlueprintProps = { ...this.input }

            // Validation
            try {
                flowBlueprintProps.flows = JSON.parse(flowBlueprintProps.flows)
            } catch (err) {
                this.error = 'Invalid JSON for flows'
                this.errors.flows = err
                return
            }
            try {
                flowBlueprintProps.modules = JSON.parse(flowBlueprintProps.modules)
            } catch (err) {
                this.error = 'Invalid JSON for modules'
                this.errors.modules = err
                return
            }

            try {
                // Update
                if (this.flowBlueprint?.id) {
                    const flowBlueprint = await FlowBlueprintsApi.updateFlowBlueprint(this.flowBlueprint.id, flowBlueprintProps)
                    this.$emit('flow-blueprint-updated', flowBlueprint)

                // Create
                } else {
                    const flowBlueprint = await FlowBlueprintsApi.createFlowBlueprint(flowBlueprintProps)
                    this.$emit('flow-blueprint-created', flowBlueprint)
                }

                return this.$refs.dialog.close()
            } catch (error) {
                console.error(error.response.data)
                if (error.response?.data?.error) {
                    const errorResponse = error.response.data
                    this.error = errorResponse.error
                    if (errorResponse.message.includes('flows')) {
                        this.errors.flows = errorResponse.message
                    }
                    if (errorResponse.message.includes('modules')) {
                        this.errors.modules = errorResponse.message
                    }
                } else {
                    this.error = 'Unknown error, please try again'
                }
            }
        }
    }
}
</script>
