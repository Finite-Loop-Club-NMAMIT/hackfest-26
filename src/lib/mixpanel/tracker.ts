import mixpanel from "./";

export type Actor = {
    id: string;
    name: string;
    role: string[];
    permissions: string[];
};

export type Entity = {
    id: string;
    name: string;
    type: string;
};

export type trackingParams = {
    actor: Actor;
    action: string;
    entity: Entity;
    previousValue?: any;
    newValue?: any;
};

export async function trackAudit({
    actor,
    action,
    entity,
    previousValue = null,
    newValue = null
}: trackingParams) {
    mixpanel.track(`${entity.type} ${action}`, {
        actor_id: actor.id,
        actor_name: actor.name,
        actor_role: actor.role,
        actor_permissions: actor.permissions,

        entity_type: entity.type,
        entity_id: entity.id,
        entity_name: entity.name,

        previous_value: previousValue,
        new_value: newValue,
        source: "Hackfest Dashboard"
    });
}
