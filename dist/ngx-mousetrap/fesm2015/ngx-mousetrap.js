import { ɵɵdefineInjectable, ɵsetClassMetadata, Injectable, EventEmitter, ɵɵdirectiveInject, ElementRef, ɵɵdefineDirective, Directive, Input, Output, ɵɵdefineNgModule, ɵɵdefineInjector, ɵɵsetNgModuleScope, NgModule } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import * as Mousetrap from 'mousetrap';

class NgxMousetrapService {
    constructor() {
        this.scopedMouseTrap = new WeakMap();
        // map of keycombination and hotkey details.
        this.keyMap = new Map();
        this.paused = false;
        this.mousetrap = new Mousetrap();
        const origninalCB = this.mousetrap.stopCallback;
        this.mousetrap.stopCallback = (e, element, combo) => {
            if (this.paused) {
                return true;
            }
            return origninalCB.apply(this.mousetrap, [e, element, combo]);
        };
    }
    /**
     * Registers the hot key combinations and returns an observable which will be
     * triggred when hotkey combination is pressed
     * @param keys list of hotkey combinations
     */
    register(key, scope) {
        if (!key) {
            return EMPTY;
        }
        let keyMap = this.keyMap;
        let mousetrapInstance = this.mousetrap;
        if (scope) {
            if (!this.scopedMouseTrap.has(scope)) {
                keyMap = new Map();
                mousetrapInstance = new Mousetrap(scope);
                this.scopedMouseTrap.set(scope, { keyMap, mousetrap: mousetrapInstance });
            }
            else {
                mousetrapInstance = this.scopedMouseTrap.get(scope).mousetrap;
                keyMap = this.scopedMouseTrap.get(scope).keyMap;
            }
        }
        if (keyMap.has(key)) {
            return keyMap.get(key).handler$.asObservable().pipe(throttleTime(300));
        }
        const handler$ = new Subject();
        const keyCombos = key.split('|').map(part => part.trim());
        // bind the key to mousetrap
        mousetrapInstance.bind(keyCombos, (e, combo) => {
            handler$.next({
                key: combo,
                event: e
            });
        });
        const value = { handler$ };
        keyMap.set(key, value);
        // throttle the key press.
        return handler$.asObservable().pipe(throttleTime(300));
    }
    /**
     * unregister the keys.
     * @param keys list of key combnations
     */
    unregister(scope = null, ...keys) {
        let mousetrap = this.mousetrap;
        let keyMap = this.keyMap;
        let keysList = keys;
        if (scope && this.scopedMouseTrap.has(scope)) {
            mousetrap = this.scopedMouseTrap.get(scope).mousetrap;
            keyMap = this.scopedMouseTrap.get(scope).keyMap;
            if (!keys || keys.length === 0) {
                keysList = Array.from(this.scopedMouseTrap.get(scope).keyMap.keys());
            }
        }
        if (!keysList || keysList.length === 0) {
            return;
        }
        keysList.forEach(k => this._unregister(k, mousetrap, keyMap));
    }
    /**
     * unregister the given key combination.
     * if the key is the last key for the observable, the complete the observable.
     * @param key key combination
     * @param mousetrap mousetrap instance
     * @param keyMap key map
     */
    _unregister(key, mousetrap, keyMap) {
        mousetrap.unbind(key);
        if (keyMap.has(key)) {
            const value = keyMap.get(key);
            value.handler$.complete();
            keyMap.delete(key);
        }
    }
}
NgxMousetrapService.ɵfac = function NgxMousetrapService_Factory(t) { return new (t || NgxMousetrapService)(); };
NgxMousetrapService.ɵprov = ɵɵdefineInjectable({ token: NgxMousetrapService, factory: NgxMousetrapService.ɵfac, providedIn: 'root' });
/*@__PURE__*/ (function () { ɵsetClassMetadata(NgxMousetrapService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], function () { return []; }, null); })();

class NgxMousetrapDirective {
    constructor(elementRef, ngxMousetrapService) {
        this.elementRef = elementRef;
        this.ngxMousetrapService = ngxMousetrapService;
        // emits an event when hotkey is pressed.
        this.mousetrapKeyPressed = new EventEmitter();
    }
    ngOnInit() {
        if (!this.ngxMousetrapKey) {
            console.error(`No hotkey available for ${this.elementRef.nativeElement}`);
            return;
        }
        this.ngxMousetrapService.register(this.ngxMousetrapKey).subscribe(hkEvent => {
            if (!this.suppressAutoClick) {
                this.elementRef.nativeElement.dispatchEvent(new Event('click'));
            }
            this.mousetrapKeyPressed.emit(hkEvent);
        });
    }
    ngOnDestroy() {
        if (this.ngxMousetrapKey) {
            this.ngxMousetrapService.unregister(null, this.ngxMousetrapKey);
        }
    }
}
NgxMousetrapDirective.ɵfac = function NgxMousetrapDirective_Factory(t) { return new (t || NgxMousetrapDirective)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgxMousetrapService)); };
NgxMousetrapDirective.ɵdir = ɵɵdefineDirective({ type: NgxMousetrapDirective, selectors: [["", "ngxMousetrapKey", ""]], inputs: { ngxMousetrapKey: "ngxMousetrapKey", suppressAutoClick: "suppressAutoClick" }, outputs: { mousetrapKeyPressed: "mousetrapKeyPressed" } });
/*@__PURE__*/ (function () { ɵsetClassMetadata(NgxMousetrapDirective, [{
        type: Directive,
        args: [{
                selector: '[ngxMousetrapKey]'
            }]
    }], function () { return [{ type: ElementRef }, { type: NgxMousetrapService }]; }, { ngxMousetrapKey: [{
            type: Input
        }], suppressAutoClick: [{
            type: Input
        }], mousetrapKeyPressed: [{
            type: Output
        }] }); })();

class NgxMousetrapModule {
    static forRoot() {
        return {
            ngModule: NgxMousetrapModule,
            providers: [
                NgxMousetrapService
            ]
        };
    }
}
NgxMousetrapModule.ɵmod = ɵɵdefineNgModule({ type: NgxMousetrapModule });
NgxMousetrapModule.ɵinj = ɵɵdefineInjector({ factory: function NgxMousetrapModule_Factory(t) { return new (t || NgxMousetrapModule)(); }, providers: [NgxMousetrapService], imports: [[]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && ɵɵsetNgModuleScope(NgxMousetrapModule, { declarations: [NgxMousetrapDirective], exports: [NgxMousetrapDirective] }); })();
/*@__PURE__*/ (function () { ɵsetClassMetadata(NgxMousetrapModule, [{
        type: NgModule,
        args: [{
                declarations: [NgxMousetrapDirective],
                imports: [],
                exports: [NgxMousetrapDirective],
                providers: [NgxMousetrapService]
            }]
    }], null, null); })();

/*
 * Public API Surface of ngx-mousetrap
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgxMousetrapDirective, NgxMousetrapModule, NgxMousetrapService };
//# sourceMappingURL=ngx-mousetrap.js.map
