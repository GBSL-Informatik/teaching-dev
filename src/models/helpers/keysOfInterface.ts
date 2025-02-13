type Invalid<T> = ['Needs to be all of', T];
// https://stackoverflow.com/a/73457231
export const keysOfInterface =
    <T>() =>
    <U extends T[]>(...array: U & ([T] extends [U[number]] ? unknown : Invalid<T>[])) =>
        array;
