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

    function rejectionLocation(reason) {
        const stack = typeof reason?.stack === 'string' ? reason.stack : '';
        const match = stack.match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/);
        if (!match) {
            return {
                source: sourcePath(windowObject.location.href),
                line: null,
                column: null
            };
        }
        return {
            source: sourcePath(match[1]),
            line: Number(match[2]) || null,
            column: Number(match[3]) || null
        };
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
        const location = rejectionLocation(event.reason);
        send({
            errorType: event.reason?.name || 'UnhandledPromiseRejection',
            source: location.source,
            line: location.line,
            column: location.column
        });
    });
}(window));
