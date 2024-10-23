const MyPromiseStates = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};

// Тут нету микротасок, ну и такая простенькая имплементация, куча методом не хватает
class MyPromise {
    constructor(callback) {
        this.state = MyPromiseStates.PENDING;
        this.result = undefined;
        this.error = undefined;
        this._resolveCallbacks = [];
        this._rejectCallbacks = [];
        try {
            callback(this._resolve.bind(this), this._reject.bind(this));
        } catch (error) {
            this._reject(error);
        }
    }

    _resolve(result) {
        if (this.state === MyPromiseStates.PENDING) {
            this.result = result;
            this.state = MyPromiseStates.FULFILLED;
            while (this._resolveCallbacks.length) {
                const callback = this._resolveCallbacks.shift();
                callback(this.result);
            }
        }
    }

    _reject(error) {
        if (this.state === MyPromiseStates.PENDING) {
            this.error = error;
            this.state = MyPromiseStates.REJECTED;
            while (this._rejectCallbacks.length) {
                const callback = this._rejectCallbacks.shift();
                callback(this.error);
            }
        }
    }

    then(onResolve, onReject) {
        return new MyPromise((resolve, reject) => {
            const handleResolve = (result) => {
                if (!onResolve) {
                    resolve(result);
                    return;
                }
                try {
                    const newResult = onResolve(result);
                    if (newResult instanceof MyPromise) {
                        newResult.then(resolve, reject);
                    } else {
                        resolve(newResult);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            const handleReject = (error) => {
                if (!onReject) {
                    reject(error);
                    return;
                }
                try {
                    const newResult = onReject(error);
                    if (newResult instanceof MyPromise) {
                        newResult.then(resolve, reject);
                    } else {
                        resolve(newResult);
                    }
                } catch (e) {
                    reject(e);
                }
            };

            if (this.state === MyPromiseStates.FULFILLED) {
                handleResolve(this.result);
            } else if (this.state === MyPromiseStates.REJECTED) {
                handleReject(this.error);
            } else {
                this._resolveCallbacks.push(handleResolve);
                this._rejectCallbacks.push(handleReject);
            }
        });
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }
}


// Тесты
new MyPromise(resolve => resolve(1))
    .then(num => num + 1)
    .then(num => num * 2)
    .then(result => console.log(result));

new MyPromise(resolve => resolve(1))
    .then(num => {
        return new MyPromise(resolve => setTimeout(() => resolve(num + 1), 1000))
    })
    .then(num => {
        return new MyPromise(resolve => setTimeout(() => resolve(num * 2), 1000))
    })
    .then(result => console.log(result));

new MyPromise(resolve => resolve(1))
    .then(() => {
        throw new Error('My Promise Error');
    })
    .catch(error => {
        console.log('Catched error:', error.message);
        return 'fallback results';
    })
    .then(x => console.log('After recovery:', x));

new MyPromise((_, reject) => reject(new Error('My Promise Error 2')))
    .then(() => console.log('Shouldnt run'))
    .catch(error => console.log('Catched error 2:', error.message));