class BackgroundManager {
    constructor() {
        this.assetFileName = 'Gemini_Generated_Image_oic52woic52woic5.png';
    }

    setBackground() {
        const layer = document.querySelector('.parallax-layer.parallax-layer-1');
        const applyBg = (url) => {
            const css = `url("${url}")`;
            if (layer) {
                layer.style.backgroundImage = css;
                layer.style.backgroundSize = 'cover';
                layer.style.backgroundPosition = 'center';
                layer.style.backgroundRepeat = 'no-repeat';
            } else {
                const body = document.body;
                body.style.backgroundImage = css;
                body.style.backgroundSize = 'cover';
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundPosition = 'center';
                body.style.backgroundRepeat = 'no-repeat';
            }
        };

        this.resolveBackgroundUrl()
            .then(applyBg)
            .catch(() => { if (layer) layer.style.backgroundImage = 'none'; });
    }

    resolveBackgroundUrl() {
        const origin = window.location.origin;
        const candidates = [
            `/Assets/${this.assetFileName}`,
            `${origin}/Assets/${this.assetFileName}`,
            // Production CDN path (same domain as live site)
            `https://cncassam.com/Assets/${this.assetFileName}`
        ];
        return new Promise((resolve, reject) => {
            const tryNext = (i) => {
                if (i >= candidates.length) return reject();
                const url = candidates[i];
                const img = new Image();
                img.onload = () => resolve(url);
                img.onerror = () => tryNext(i + 1);
                img.src = url;
            };
            tryNext(0);
        });
    }
}

window.BackgroundManager = BackgroundManager;



