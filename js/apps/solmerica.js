export function createApp(container) {
    const solState = {
        currentScreen: 'welcome',
        dropdownValue: 'Guest',
        animStep: 0,
        screenName: '',
        password: '',
        animationInterval: null
    };

    let windowEl = container.closest('.window');
    let contentEl = container;

    function buildScreen() {
        contentEl.innerHTML = '';
        contentEl.classList.add('solmerica-window');

        switch (solState.currentScreen) {
            case 'welcome':
                windowEl.querySelector('span').textContent = 'Welcome';
                windowEl.style.width = '640px';
                windowEl.style.height = '570px';
                contentEl.innerHTML = `
                    <div style="display: flex; width: 100%; height: 100%;">
                        <div class="sol-sidebar" style="background-image: url('icons/AOL/Untitled.jpg');"></div>
                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px;">
                            <img src="icons/AOL/Logo_login.png" alt="Logo" class="sol-logo" style="max-width: 200px; max-height: 150px; margin-bottom: 20px;">
                            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Solmerica Online v3.0</div>
                            <div style="margin-bottom: 10px;">
                                <label for="userType">Select Screen Name:</label>
                                <select id="userType" class="sol-dropdown">
                                    <option value="New User">New User</option>
                                    <option value="Existing Member">Existing Member</option>
                                    <option value="Guest" selected>Guest</option>
                                </select>
                            </div>
                            <button class="sol-button" id="signOnBtn">SIGN ON</button>
                            <div style="position: absolute; bottom: 10px; font-size: 10px; color: #666;">Press Alt + F4 to Exit</div>
                        </div>
                    </div>
                `;
                break;
            case 'connecting':
                windowEl.querySelector('span').textContent = 'Solmerica Online';
                windowEl.style.width = '700px';
                windowEl.style.height = '455px';
                contentEl.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 20px;">
                        <img src="icons/AOL/logo_long.png" alt="Logo" class="sol-logo" style="max-width: 300px; max-height: 100px; margin-bottom: 20px;">
                        <div style="display: flex; margin-bottom: 20px;">
                            <img src="icons/AOL/dialup/1dialup.jpg" alt="Frame 1" class="sol-frame" id="frame1">
                            <img src="icons/AOL/dialup/2dialup.jpg" alt="Frame 2" class="sol-frame" id="frame2">
                            <img src="icons/AOL/dialup/3dialup.jpg" alt="Frame 3" class="sol-frame" id="frame3">
                        </div>
                        <div id="stepText" style="font-size: 14px; margin-bottom: 20px;">Step 1: Dialing...</div>
                        <button class="sol-button" id="cancelBtn">Cancel</button>
                    </div>
                `;
                break;
            case 'login':
                windowEl.querySelector('span').textContent = 'Solmerica Online';
                windowEl.style.width = '433px';
                windowEl.style.height = '274px';
                contentEl.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 20px;">
                        <img src="icons/AOL/logo_long.png" alt="Logo" class="sol-logo" style="max-width: 300px; max-height: 100px; margin-bottom: 20px;">
                        <div style="margin-bottom: 10px;">
                            <label for="screenName">Screen Name:</label>
                            <input type="text" id="screenName" class="sol-input" maxlength="20">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label for="password">Password:</label>
                            <input type="password" id="password" class="sol-input" maxlength="20">
                        </div>
                        <button class="sol-button" id="signOnBtn2">Sign On</button>
                    </div>
                `;
                break;
        }

        bindEvents();
    }

    function bindEvents() {
        if (solState.currentScreen === 'welcome') {
            const userType = contentEl.querySelector('#userType');
            const signOnBtn = contentEl.querySelector('#signOnBtn');

            userType.addEventListener('change', (e) => {
                solState.dropdownValue = e.target.value;
            });

            signOnBtn.addEventListener('click', advanceScreen);
        } else if (solState.currentScreen === 'connecting') {
            const cancelBtn = contentEl.querySelector('#cancelBtn');
            cancelBtn.addEventListener('click', () => {
                closeWindow(windowEl);
            });
        } else if (solState.currentScreen === 'login') {
            const screenNameInput = contentEl.querySelector('#screenName');
            const passwordInput = contentEl.querySelector('#password');
            const signOnBtn2 = contentEl.querySelector('#signOnBtn2');

            screenNameInput.addEventListener('input', (e) => {
                solState.screenName = e.target.value;
            });

            passwordInput.addEventListener('input', (e) => {
                solState.password = e.target.value;
            });

            signOnBtn2.addEventListener('click', () => {
                solState.screenName = solState.screenName.trim();
                solState.password = solState.password.trim();
                // Assuming global aolConnection is accessible
                window.aolConnection.isConnected = true;
                window.aolConnection.speed = 56000;
                window.aolConnection.status = 'Connected at 56,000 bps';
                closeWindow(windowEl);
            });
        }
    }

    function advanceScreen() {
        if (solState.currentScreen === 'welcome') {
            solState.currentScreen = 'connecting';
            buildScreen();
            startAnim();
        } else if (solState.currentScreen === 'connecting') {
            solState.currentScreen = 'login';
            buildScreen();
        }
    }

    function startAnim() {
        playSound('boot.wav');
        solState.animationInterval = setInterval(() => {
            solState.animStep++;
            updateAnim();
            if (solState.animStep >= 3) {
                clearInterval(solState.animationInterval);
                solState.animationInterval = null;
                advanceScreen();
            }
        }, 2000);
    }

    function updateAnim() {
        const frames = contentEl.querySelectorAll('.sol-frame');
        const stepText = contentEl.querySelector('#stepText');

        frames.forEach((frame, index) => {
            const baseSrc = `icons/AOL/dialup/${index+1}dialup.jpg`;
            const activeSrc = `icons/AOL/dialup/${index+1}dialup_active.jpg`;
            if (solState.animStep === 0) {
                frame.src = baseSrc;
            } else if (solState.animStep === 1 && index === 0) {
                frame.src = activeSrc;
            } else if (solState.animStep === 2 && index < 2) {
                frame.src = activeSrc;
            } else if (solState.animStep === 3) {
                frame.src = activeSrc;
            }
        });

        if (solState.animStep === 1) {
            stepText.textContent = 'Step 2: Connecting to Solmerica Online';
        } else if (solState.animStep === 2) {
            stepText.textContent = 'Step 3: Connected at 56,000 bps';
        }
    }

    function resize(w, h) {
        // Flexbox handles centering/scaling automatically
        // Adjust img sizes if needed
        const logos = contentEl.querySelectorAll('.sol-logo');
        logos.forEach(logo => {
            logo.style.maxWidth = Math.min(w * 0.8, 300) + 'px';
            logo.style.maxHeight = Math.min(h * 0.3, 150) + 'px';
        });
    }

    function destroy() {
        if (solState.animationInterval) {
            clearInterval(solState.animationInterval);
        }
        // Remove event listeners if needed, but since DOM is rebuilt, not necessary
    }

    // Initialize
    buildScreen();

    return { resize, destroy };
}

// Assuming playSound and closeWindow are global functions
function playSound(src) {
    const audio = new Audio(src);
    audio.play();
}

function closeWindow(windowEl) {
    // Assuming closeWindow function exists globally
    if (window.closeWindow) {
        window.closeWindow(windowEl);
    }
}