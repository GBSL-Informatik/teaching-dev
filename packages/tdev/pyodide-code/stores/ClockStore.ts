import { action, observable } from 'mobx';
import { Clock } from '../models/Clock';

class ClockStore {
    @observable.ref accessor defaultClock = new Clock();
    clocks = observable.map<string, Clock>([], { deep: false });

    @action
    useClock(id: string, animationSpeed?: number) {
        if (this.clocks.has(id)) {
            const clock = this.clocks.get(id)!;
            if (animationSpeed !== undefined) {
                clock.setAnimationSpeed(animationSpeed);
            }
            return clock;
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
        if (this.clocks.has(id)) {
            const clock = this.clocks.get(id)!;
            clock.setClock(hourDeg, minutesDeg, secondsDeg);
            return;
        }
        const clock = new Clock();
        clock.setClock(hourDeg, minutesDeg, secondsDeg);
        this.clocks.set(id, clock);
    }
}

export default ClockStore;
