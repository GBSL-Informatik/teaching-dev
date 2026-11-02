from browser import window

def use_clock(id: str, speed = None):
    clk_ext=window.store.viewStore.useStore('pyodideStore').extensions.instancesByName.get('clock')
    clk_store = window.store.viewStore.useStore('pyodideStore').extensions.storesByExtension.get(clk_ext.extension)
    clk = clk_store.useClock(id)
    if speed is not None:
        clk.setAnimationSpeed(speed)
    return clk