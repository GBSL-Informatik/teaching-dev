import { action, computed, observable } from 'mobx';
import { SignupToken as SignupTokenProps } from '@tdev-api/signupToken';
import _ from 'lodash';
import { SignupTokenStore } from '@tdev-stores/SignupTokenStore';
import { formatDateTime } from './helpers/date';

class SignupToken {
    readonly store: SignupTokenStore;

    readonly id: string;
    readonly uses: number;

    @observable accessor method: string;
    @observable accessor description: string;
    @observable accessor validThrough: Date | null;
    @observable accessor maxUses: number;
    @observable accessor disabled: boolean;

    @observable accessor isEditing: boolean = false;
    readonly _pristine: { description: string; validThrough: Date | null; maxUses: number };

    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: SignupTokenProps, store: SignupTokenStore) {
        this.store = store;
        this.id = props.id;
        this.uses = props.uses;

        const validThrough = props.validThrough ? new Date(props.validThrough) : null;

        this.method = props.method; // TODO: Should this be readonly, since it can't be updated?
        this.description = props.description;
        this.validThrough = validThrough;
        this.maxUses = props.maxUses;
        this.disabled = props.disabled;

        this._pristine = {
            description: props.description,
            validThrough: validThrough,
            maxUses: props.maxUses
        };

        this.updatedAt = new Date(props.updatedAt);
        this.createdAt = new Date(props.createdAt);
    }

    get fValidThrough() {
        return this.validThrough ? formatDateTime(this.validThrough) : null;
    }

    get fCreatedAt() {
        return formatDateTime(this.createdAt);
    }

    get fUpdatedAt() {
        return formatDateTime(this.updatedAt);
    }

    @action
    setEditing(isEditing: boolean) {
        this.isEditing = isEditing;
    }

    // TODO: Set method?

    @action
    setDescription(description: string) {
        this.description = description;
    }

    @action
    setValidThrough(validThrough: Date | null) {
        this.validThrough = validThrough;
    }

    @action
    setMaxUses(maxUses: number) {
        this.maxUses = maxUses;
    }

    @action
    setDisabled(disabled: boolean) {
        this.disabled = disabled;
    }

    @action
    reset() {
        this.description = this._pristine.description;
        this.validThrough = this._pristine.validThrough;
        this.maxUses = this._pristine.maxUses;
    }

    @action
    save() {
        return this.store.save(this);
    }

    @computed
    get props(): Omit<SignupTokenProps, 'method' | 'uses' | 'createdAt' | 'updatedAt'> {
        return {
            id: this.id,
            description: this.description,
            maxUses: this.maxUses,
            validThrough: this.validThrough,
            disabled: this.disabled
        };
    }

    // TODO: Default student groups.
}

export default SignupToken;
