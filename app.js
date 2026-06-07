/**
 * endpointlab - Single Page Application Core Logic (app.js)
 */

const app = {
  // 1. Initial State
  currentTab: 'home',
  guidelinesLoaded: false,
  simulatorMode: 'unoptimized', // 'unoptimized' | 'optimized'
  simulatorInterval: null,

  // 2. Tab Navigation / Hash Router
  initRouter() {
    const handleRoute = () => {
      let hash = window.location.hash.substring(1);
      if (!hash) {
        hash = 'home';
        window.location.hash = '#home';
        return;
      }
      this.setActiveTab(hash);
    };

    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);

    // Setup nav click events
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        window.location.hash = `#${target}`;
      });
    });
  },

  navigateToTab(tabId) {
    window.location.hash = `#${tabId}`;
  },

  setActiveTab(tabId) {
    this.currentTab = tabId;

    // Toggle active classes in Header NAV
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-target') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle active sections in Main
    document.querySelectorAll('.tab-section').forEach(sec => {
      if (sec.id === tabId) {
        sec.classList.add('active');
        // Trigger specific tab loading logic
        if (tabId === 'guidelines') {
          this.loadGuidelines();
        }
      } else {
        sec.classList.remove('active');
      }
    });

    // Back to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // 3. Lab Performance Simulator
  initSimulator() {
    const btnUnopt = document.getElementById('btn-mode-unopt');
    const btnOpt = document.getElementById('btn-mode-opt');

    if (btnUnopt && btnOpt) {
      btnUnopt.addEventListener('click', () => this.switchSimulatorMode('unoptimized'));
      btnOpt.addEventListener('click', () => this.switchSimulatorMode('optimized'));
    }

    // Run initial state setup
    this.updateSimulatorUI();
  },

  switchSimulatorMode(mode) {
    if (this.simulatorMode === mode) return;
    this.simulatorMode = mode;

    // UI Active button toggle
    const btnUnopt = document.getElementById('btn-mode-unopt');
    const btnOpt = document.getElementById('btn-mode-opt');
    
    if (mode === 'unoptimized') {
      btnUnopt.classList.add('active');
      btnOpt.classList.remove('active');
    } else {
      btnUnopt.classList.remove('active');
      btnOpt.classList.add('active');
    }

    this.updateSimulatorUI();
  },

  updateSimulatorUI() {
    const isOpt = this.simulatorMode === 'optimized';

    // Elements
    const lcpVal = document.getElementById('lcp-val');
    const lcpStatus = document.getElementById('lcp-status');
    const lcpProgress = document.getElementById('lcp-progress');
    const lcpCard = document.getElementById('card-lcp');

    const fpsVal = document.getElementById('fps-val');
    const fpsStatus = document.getElementById('fps-status');
    const fpsProgress = document.getElementById('fps-progress');
    const fpsCard = document.getElementById('card-fps');

    const sizeVal = document.getElementById('size-val');
    const sizeStatus = document.getElementById('size-status');
    const sizeProgress = document.getElementById('size-progress');
    const sizeCard = document.getElementById('card-size');

    const scoreCircle = document.getElementById('score-circle');
    const scoreVal = document.getElementById('score-val');

    // Canvas & Demo
    const demoCanvas = document.getElementById('demo-canvas');
    const demoSpinner = document.getElementById('demo-spinner');
    const demoCard1 = document.getElementById('demo-card-1');
    const demoCard2 = document.getElementById('demo-card-2');

    // Values definition
    const targetValues = isOpt ? {
      lcp: 0.8,
      fps: 60,
      size: 120, // KB
      score: 100
    } : {
      lcp: 5.4,
      fps: 22,
      size: 4300, // KB (4.2 MB)
      score: 34
    };

    // 1. Animate Values
    this.animateValue(lcpVal, parseFloat(lcpVal.innerText), targetValues.lcp, 1000, 's');
    this.animateValue(fpsVal, parseInt(fpsVal.innerText), targetValues.fps, 1000, ' fps');
    
    // Custom MB/KB sizing formatting
    if (isOpt) {
      this.animateValue(sizeVal, parseFloat(sizeVal.innerText) * 1024 || 4300, 120, 1000, ' KB');
    } else {
      this.animateValue(sizeVal, parseFloat(sizeVal.innerText) || 120, 4.2, 1000, ' MB');
    }

    this.animateValue(scoreVal, parseInt(scoreVal.innerText), targetValues.score, 1000, '');

    // 2. Progress bars & Status badges
    if (isOpt) {
      // LCP Optimized
      lcpStatus.className = 'metric-status status-good';
      lcpStatus.innerText = 'Fast';
      lcpProgress.className = 'progress-bar bar-good';
      lcpProgress.style.width = '12%';

      // FPS Optimized
      fpsStatus.className = 'metric-status status-good';
      fpsStatus.innerText = 'Butter Smooth';
      fpsProgress.className = 'progress-bar bar-good';
      fpsProgress.style.width = '100%';

      // Size Optimized
      sizeStatus.className = 'metric-status status-good';
      sizeStatus.innerText = 'Ultralight';
      sizeProgress.className = 'progress-bar bar-good';
      sizeProgress.style.width = '3%';

      // Score circle
      scoreCircle.className = 'score-circle-progress circle-good';
      // 251.2 is 2 * PI * r (r=40). 100% score means dashoffset = 0
      scoreCircle.style.strokeDashoffset = '0';
      scoreVal.className = 'score-text text-good';
    } else {
      // LCP Unoptimized
      lcpStatus.className = 'metric-status status-bad';
      lcpStatus.innerText = 'Slow';
      lcpProgress.className = 'progress-bar bar-bad';
      lcpProgress.style.width = '85%';

      // FPS Unoptimized
      fpsStatus.className = 'metric-status status-bad';
      fpsStatus.innerText = 'Laggy';
      fpsProgress.className = 'progress-bar bar-bad';
      fpsProgress.style.width = '36%';

      // Size Unoptimized
      sizeStatus.className = 'metric-status status-bad';
      sizeStatus.innerText = 'Heavy';
      sizeProgress.className = 'progress-bar bar-bad';
      sizeProgress.style.width = '90%';

      // Score circle
      scoreCircle.className = 'score-circle-progress circle-bad';
      // 34% score means dashoffset = 251.2 * (1 - 0.34) = 165.8
      scoreCircle.style.strokeDashoffset = '165.8';
      scoreVal.className = 'score-text text-bad';
    }

    // 3. Demo rendering simulation
    // Reset Canvas demo state
    demoSpinner.style.display = 'block';
    demoSpinner.style.animation = isOpt ? 'spin 0.4s infinite linear' : 'spin 1.8s infinite steps(8)'; // Stutter spin for bad mode
    demoCard1.style.display = 'none';
    demoCard1.style.opacity = '0';
    demoCard2.style.display = 'none';
    demoCard2.style.opacity = '0';

    if (isOpt) {
      // Fast load (Optimized)
      setTimeout(() => {
        demoSpinner.style.display = 'none';
        
        // Show real content fast
        demoCard1.style.display = 'block';
        demoCard2.style.display = 'block';
        
        // Populate actual contents instead of skeleton
        demoCard1.innerHTML = `<h4 style="margin-bottom:0.5rem;color:var(--color-blue)">LCP Optimized</h4><p style="font-size:0.85rem;color:var(--text-secondary)">로드 완료 및 첫 프레임 노출이 단 0.8초만에 완료되었습니다.</p>`;
        demoCard2.innerHTML = `<h4 style="margin-bottom:0.5rem;color:var(--color-blue)">butter-smooth</h4><p style="font-size:0.85rem;color:var(--text-secondary)">60fps 프레임 고정으로 스크롤 및 인터랙션 반응을 부드럽게 유지합니다.</p>`;
        
        setTimeout(() => {
          demoCard1.style.opacity = '1';
          demoCard2.style.opacity = '1';
        }, 50);
      }, 300); // 300ms rendering delay simulated (Optimized)
    } else {
      // Slow loading with layout shift (Unoptimized)
      setTimeout(() => {
        // Keeps spinner running longer
        setTimeout(() => {
          demoSpinner.style.display = 'none';
          
          // Show skeletons with delays (cumulative rendering lag)
          demoCard1.style.display = 'block';
          demoCard1.innerHTML = `<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line-short"></div>`;
          
          setTimeout(() => {
            demoCard1.style.opacity = '1';
          }, 50);

          setTimeout(() => {
            demoCard2.style.display = 'block';
            demoCard2.innerHTML = `<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line-short"></div>`;
            setTimeout(() => {
              demoCard2.style.opacity = '1';
            }, 50);
          }, 1200); // 1.2s layout shift lag
          
        }, 1500); // Spinner loads for 1.5s
      }, 100);
    }
  },

  // Helper for numeric count transition
  animateValue(obj, start, end, duration, suffix = '') {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = progress * (end - start) + start;
      
      // Formatting
      if (suffix.includes('MB') || suffix.includes('s')) {
        obj.innerHTML = currentVal.toFixed(1) + suffix;
      } else if (suffix.includes('KB')) {
        obj.innerHTML = Math.round(currentVal) + suffix;
      } else {
        obj.innerHTML = Math.floor(currentVal) + suffix;
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  },

  // 4. Markdown Guidelines Loader & Parser
  loadGuidelines() {
    if (this.guidelinesLoaded) return; // Load only once

    const loader = document.getElementById('viewer-loader');
    const contentBox = document.getElementById('guidelines-content');

    const displayError = (msg) => {
      loader.style.display = 'none';
      contentBox.innerHTML = `
        <div style="padding: 2rem; border: 1px dashed var(--color-red); border-radius: 8px; background: rgba(239,68,68,0.05); text-align: center;">
          <h4 style="color:var(--color-red); margin-bottom:1rem;">지침서 로드 실패</h4>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem; font-size:0.95rem;">${msg}</p>
          <button class="secondary-btn" onclick="app.loadGuidelines()" style="padding: 0.5rem 1.2rem; font-size:0.85rem;">다시 시도</button>
        </div>
      `;
    };

    // Fetch the markdown document
    fetch('performance-guidelines.md')
      .then(response => {
        if (!response.ok) {
          throw new Error(`파일을 찾을 수 없거나 서버 연결 오류가 발생했습니다. (HTTP ${response.status})`);
        }
        return response.text();
      })
      .then(markdownText => {
        // Wait for marked library to load
        this.waitForMarked(() => {
          try {
            // Configure marked options
            marked.setOptions({
              gfm: true,
              breaks: true,
              headerIds: true,
              mangle: false
            });

            // Parse Markdown to HTML
            const htmlContent = marked.parse(markdownText);
            
            // Hide Loader
            loader.style.display = 'none';
            contentBox.innerHTML = htmlContent;

            // Trigger Prism JS Syntax highlight
            if (window.Prism) {
              window.Prism.highlightAllUnder(contentBox);
            }

            // Generate TOC (Table of Contents)
            this.generateTOC(contentBox);
            
            this.guidelinesLoaded = true;
          } catch (err) {
            console.error(err);
            displayError('마크다운 데이터를 해석하는 중 에러가 발생했습니다.');
          }
        });
      })
      .catch(error => {
        console.error(error);
        displayError(`보안 정책(CORS) 또는 파일 부재로 문서를 가져오지 못했습니다. <br>로컬에서 확인 시 웹 서버(e.g., Live Server) 환경을 통해 구동 중인지 확인해 주세요.`);
      });
  },

  // Safety checker for script load
  waitForMarked(callback) {
    if (window.marked) {
      callback();
    } else {
      setTimeout(() => this.waitForMarked(callback), 50);
    }
  },

  // Generates TOC sidebar listing automatically
  generateTOC(contentElement) {
    const tocContainer = document.getElementById('guidelines-toc');
    if (!tocContainer) return;

    tocContainer.innerHTML = '';
    
    // Find all H2 headers
    const headings = contentElement.querySelectorAll('h2');
    
    if (headings.length === 0) {
      tocContainer.innerHTML = '<li class="sidebar-item" style="color:var(--text-muted); font-size:0.85rem;">목차가 없습니다.</li>';
      return;
    }

    headings.forEach((heading, idx) => {
      // Ensure heading has an ID
      if (!heading.id) {
        heading.id = `section-${idx}`;
      }

      const li = document.createElement('li');
      li.className = 'sidebar-item';
      if (idx === 0) li.classList.add('active'); // active first one

      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.innerText = heading.innerText.replace(/^\d+\.\s*/, ''); // strip leading numbers if present
      
      a.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove other actives
        tocContainer.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');

        // Scroll to heading smoothly
        heading.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Add header offset scroll adjust
        setTimeout(() => {
          window.scrollBy(0, -100);
        }, 300);
      });

      li.appendChild(a);
      tocContainer.appendChild(li);
    });

    // TOC Highlight on Scroll Spy
    let isScrolling;
    window.addEventListener('scroll', () => {
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        if (this.currentTab !== 'guidelines') return;

        let currentActiveId = '';
        headings.forEach(heading => {
          const rect = heading.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 250) {
            currentActiveId = heading.id;
          }
        });

        if (currentActiveId) {
          tocContainer.querySelectorAll('.sidebar-item').forEach(li => {
            const link = li.querySelector('a');
            if (link.getAttribute('href') === `#${currentActiveId}`) {
              li.classList.add('active');
            } else {
              li.classList.remove('active');
            }
          });
        }
      }, 66);
    });
  },

  // 5. Contact Form Submission Logic (Formspree API Integration)
  initContactForm() {
    const form = document.getElementById('contact-form');
    const successBox = document.getElementById('contact-success');
    const closeBtn = document.getElementById('btn-success-close');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('btn-submit-form');
      const origText = submitBtn.innerHTML;
      
      // Check if Formspree action url is placeholder
      if (form.action.includes('YOUR_FORMSPREE_KEY_HERE')) {
        alert('이메일 실제 전송을 위해서는 HTML 코드 내의 [YOUR_FORMSPREE_KEY_HERE] 자리에 가입하신 Formspree 폼 KEY를 입력하셔야 합니다. 임시 데모 전송으로 접수를 완료합니다.');
      }

      // Show submitting state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>전송 중...</span> <div class="spinner" style="width:14px; height:14px; border-width:2px; border-top-color:#000;"></div>`;

      const formData = new FormData(form);

      // Perform fetch submit directly to Formspree endpoint
      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;

        if (response.ok || form.action.includes('YOUR_FORMSPREE_KEY_HERE')) {
          // Show Success Box
          successBox.classList.add('active');
          form.style.opacity = '0';
          form.style.pointerEvents = 'none';
        } else {
          throw new Error('Formspree dispatch error');
        }
      })
      .catch(error => {
        console.error(error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
        alert('문의 사항 발송 중 에러가 발생했습니다. 네트워크 연결 상태를 확인 후 다시 시도해 주세요.');
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // Reset form & states
        form.reset();
        successBox.classList.remove('active');
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
      });
    }
  }
};

// Start app on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  app.initRouter();
  app.initSimulator();
  app.initContactForm();
});

// Export app globally to click handlers
window.app = app;
