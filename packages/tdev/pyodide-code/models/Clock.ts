import { action, computed, observable } from 'mobx';

export class Clock {
    /** hours, minutes and seconds ALWAYS in degrees */
    @observable accessor hours: number = 0;
    @observable accessor minutes: number = 0;
    @observable accessor seconds: number = 0;
    @observable accessor animationSpeed = 0;

    @computed
    get transitionDurationMs() {
        if (this.animationSpeed <= 0) {
            return 0;
        }
        return 1000 / this.animationSpeed;
    }

    @action
    setAnimationSpeed(speed: number) {
        this.animationSpeed = speed;
    }

    @action
    reset() {
        this.setClock(0, 0, 0);
    }

    @action
    setHours(deg: number) {
        this.hours = deg;
    }

    @action
    setMinutes(deg: number) {
        console.log('Setting minutes to', deg);
        this.minutes = deg;
    }

    @action
    setSeconds(deg: number) {
        this.seconds = deg;
    }

    @action
    setClock(hourDeg: number, minutesDeg: number, secondsDeg: number) {
        this.setHours(hourDeg);
        this.setMinutes(minutesDeg);
        this.setSeconds(secondsDeg);
    }
}

class Clocks {
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

export default Clocks;
