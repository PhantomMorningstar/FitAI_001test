(function startFitAIErrorMonitor(windowObject) {
    const endpoint = '/api/monitor/client-error';
    const sent = new Set();

    function sourcePath(value) {
        try {
            const url = new URL(value || windowObject.location.href, windowObject.location.origin);
            return url.origin === windowObject.location.origin ? url.pathname : 'external-script';
        } catch {
            return 'unknown';
        }
    }

    function send(report) {
        const fingerprint = JSON.stringify(report);
        if (sent.has(fingerprint)) return;
        sent.add(fingerprint);
        if (sent.size > 20) sent.delete(sent.values().next().value);

        const payload = JSON.stringify(report);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
            return;
        }
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
        }).catch(() => {});
    }

    windowObject.addEventListener('error', (event) => {
        send({
            errorType: event.error?.name || 'JavaScriptError',
            source: sourcePath(event.filename),
            line: Number.isInteger(event.lineno) ? event.lineno : null,
            column: Number.isInteger(event.colno) ? event.colno : null
        });
    });

    windowObject.addEventListener('unhandledrejection', (event) => {
        send({
            errorType: event.reason?.name || 'UnhandledPromiseRejection',
            source: sourcePath(windowObject.location.href),
            line: null,
            column: null
        });
    });
}(window));
