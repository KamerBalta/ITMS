import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTourState } from '../hooks/useTourState';

interface TourStep {
    targetSelector: string;
    title: string;
    description: string;
    navigateTo?: string;
    placement: 'bottom' | 'right' | 'top';
}

const TOUR_STEPS: TourStep[] = [
    {
        targetSelector: '[data-tour="sidebar-create"]',
        title: '1/6 — Görev Oluştur',
        description:
            'Buradan yeni bir görev oluşturabilirsiniz. Kısayolu da var: klavyeden "c" tuşuna basmanız yeterli.',
        placement: 'right',
    },
    {
        targetSelector: '[data-tour="sidebar-board"]',
        title: '2/6 — Board',
        description:
            'Aktif sprintinizdeki görevleri Kanban tarzında, durumlarına göre kolonlarda görürsünüz. Kartları sürükleyerek durumunu değiştirebilirsiniz.',
        navigateTo: '/board',
        placement: 'right',
    },
    {
        targetSelector: '[data-tour="sidebar-backlog"]',
        title: '3/6 — Backlog',
        description:
            "Henüz bir sprint'e alınmamış tüm görevleriniz burada. Buradan görevleri sprint'e sürükleyip planlama yapabilirsiniz.",
        navigateTo: '/backlog',
        placement: 'right',
    },
    {
        targetSelector: '[data-tour="header-search"]',
        title: '4/6 — Arama',
        description:
            'Görev, yorum, etiket, component — her şeyi buradan arayabilirsiniz. Kısayol: Ctrl+K.',
        navigateTo: '/dashboard',
        placement: 'bottom',
    },
    {
        targetSelector: '[data-tour="header-notifications"]',
        title: '5/6 — Bildirimler',
        description:
            'Size atanan görevler, mention\'lar ve sprint güncellemeleri burada birikir. Tercihlerinizi Profil sayfasından özelleştirebilirsiniz.',
        placement: 'bottom',
    },
    {
        targetSelector: '[data-tour="project-selector"]',
        title: '6/6 — Proje Seçici',
        description:
            'Birden fazla projeniz varsa buradan aralarında geçiş yapabilirsiniz. Board, Backlog ve Dashboard hep seçili projeye göre çalışır.',
        placement: 'bottom',
    },
];

export function OnboardingTour() {
    const { isCompleted, completeTour } = useTourState();
    const [stepIndex, setStepIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const navigate = useNavigate();

    const retryTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNext = () => {
        if (stepIndex >= TOUR_STEPS.length - 1) {
            setIsActive(false);
            setTargetRect(null);
            completeTour();
            return;
        }

        setTargetRect(null);
        setStepIndex((current) => current + 1);
    };

    const handleSkip = () => {
        if (retryTimeoutRef.current !== null) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        setIsActive(false);
        setTargetRect(null);
        completeTour();
    };

    /*
     * Tur tamamlanmamışsa ilk açılıştan 1 saniye sonra başlat.
     */
    useEffect(() => {
        if (isCompleted) {
            return;
        }

        const timer = setTimeout(() => {
            setIsActive(true);
        }, 1000);

        return () => {
            clearTimeout(timer);
        };
    }, [isCompleted]);

    /*
     * Aktif adımın hedef elementini bul.
     *
     * Burada effect içinde senkron setState yapmıyoruz.
     * State güncellemesi yalnızca DOM arama callback'i içerisinde
     * veya timer callback'i içerisinde gerçekleşiyor.
     */
    useEffect(() => {
        if (!isActive) {
            return;
        }

        const step = TOUR_STEPS[stepIndex];

        // stepIndex normal şartlarda her zaman geçerli olmalı.
        // Geçersizse hiçbir state değiştirmeden effect'ten çık.
        if (!step) {
            return;
        }

        let attempts = 0;
        let cancelled = false;

        const findTarget = () => {
            if (cancelled) {
                return;
            }

            const element = document.querySelector<HTMLElement>(
                step.targetSelector,
            );

            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });

                /*
                 * DOM'dan gelen ölçümü state'e aktarmak burada uygundur;
                 * bu bir external system (DOM) senkronizasyonudur.
                 */
                setTargetRect(element.getBoundingClientRect());

                retryTimeoutRef.current = null;
                return;
            }

            if (attempts < 10) {
                attempts += 1;

                retryTimeoutRef.current = setTimeout(
                    findTarget,
                    200,
                );

                return;
            }

            retryTimeoutRef.current = null;

            /*
             * Hedef bulunamadığında bir sonraki adıma geç.
             * Bu çağrı timer callback'inden geliyor.
             */
            if (!cancelled) {
                setStepIndex((current) => {
                    if (current >= TOUR_STEPS.length - 1) {
                        return current;
                    }

                    return current + 1;
                });
            }
        };

        findTarget();

        return () => {
            cancelled = true;

            if (retryTimeoutRef.current !== null) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, [isActive, stepIndex, navigate]);

    /*
     * Hedef element scroll veya resize olduğunda highlight'ın
     * konumunu güncelle.
     */
    useEffect(() => {
        if (!isActive) {
            return;
        }

        const step = TOUR_STEPS[stepIndex];

        if (!step) {
            return;
        }

        const updateTargetPosition = () => {
            const element = document.querySelector<HTMLElement>(
                step.targetSelector,
            );

            if (!element) {
                return;
            }

            setTargetRect(element.getBoundingClientRect());
        };

        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener(
            'scroll',
            updateTargetPosition,
            true,
        );

        return () => {
            window.removeEventListener(
                'resize',
                updateTargetPosition,
            );

            window.removeEventListener(
                'scroll',
                updateTargetPosition,
                true,
            );
        };
    }, [isActive, stepIndex]);

    if (!isActive || !targetRect) {
        return null;
    }

    const step = TOUR_STEPS[stepIndex];

    /*
     * Güvenlik kontrolü.
     * stepIndex'in geçerli olması normaldir.
     */
    if (!step) {
        return null;
    }

    const tooltipStyle: React.CSSProperties =
        step.placement === 'right'
            ? {
                  top: targetRect.top,
                  left: targetRect.right + 12,
              }
            : step.placement === 'bottom'
              ? {
                    top: targetRect.bottom + 12,
                    left: Math.max(
                        12,
                        targetRect.left - 100,
                    ),
                }
              : {
                    top: targetRect.top - 12,
                    left: targetRect.left,
                    transform: 'translateY(-100%)',
                };

    return (
        <>
            {/* Karartma katmanı */}
            <div
                className="fixed inset-0 bg-black/40 z-[100]"
                onClick={handleSkip}
                aria-hidden="true"
            />

            {/* Hedef elementi vurgulayan çerçeve */}
            <div
                className="fixed z-[101] ring-4 ring-indigo-400 dark:ring-indigo-500 rounded-lg pointer-events-none transition-all duration-300"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                }}
                aria-hidden="true"
            />

            {/* Tooltip */}
            <div
                className="fixed z-[102] surface border rounded-lg shadow-xl p-4 w-64 transition-all duration-300"
                style={tooltipStyle}
                role="dialog"
                aria-label="Uygulama turu"
            >
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                    {step.title}
                </p>

                <p className="text-sm text-secondary mb-3">
                    {step.description}
                </p>

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="text-xs text-muted hover:text-secondary"
                    >
                        Turu Atla
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
                    >
                        {stepIndex >= TOUR_STEPS.length - 1
                            ? 'Bitir'
                            : 'İleri →'}
                    </button>
                </div>
            </div>
        </>
    );
}
