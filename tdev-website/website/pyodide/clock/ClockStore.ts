import { action, observable, observableRef } from 'mobx';
import { Clock } from './Clock';

class ClockStore {
    @observableRef accessor defaultClock = new Clock();
    readonly clocks = observable.map<string, Clock>([], { deep: false });

    @action
    useClock(id: string, animationSpeed?: number) {
        const existingClock = this.clocks.get(id);
        if (existingClock) {
            if (animationSpeed !== undefined) {
                existingClock.setAnimationSpeed(animationSpeed);
            }
            return existingClock;
        }
        const clock = new Clock();
        if (animationSpeed !== undefined) {
            clock.setAnimationSpeed(animationSpeed);
        }
        this.clocks.set(id, clock);
        return clock;
    }

    @action
    setTimeAsDegrees(id: string, hourDeg: number, minutesDeg: number, secondsDeg: number) {
        this.useClock(id).setClock(hourDeg, minutesDeg, secondsDeg);
    }
}

export default ClockStore;
