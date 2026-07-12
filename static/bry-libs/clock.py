from browser import window

def use_clock(id: str, speed = None):
    clk = window.store.siteStore.clockStore.useClock(id)
    if speed is not None:
        clk.setAnimationSpeed(speed)
    return clk