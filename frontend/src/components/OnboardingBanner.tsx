import { Link } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { useAuthStore } from '../store/authStore';

// #11: Sistemde henuz hicbir Takim/Proje yoksa (yeni bir kurulum), ya da kullanici
// hicbir takimin uyesi degilse, bos ekranlarla bas basa birakmak yerine yonlendirici
// bir banner gosteriyoruz. Kullanici zaten ilerlemisse (bir gorevi varsa) hic gorunmez.
export function OnboardingBanner() {
    const { data: status, isLoading } = useOnboardingStatus();
    const isAdmin = useAuthStore((state) => state.user?.roles.includes('System Admin')) ?? false;

    if (isLoading || !status) return null;
    if (status.hasAnyTaskAssigned) return null; // kullanici zaten aktif calisiyor, banner'a gerek yok

    if (!status.hasAnyTeam) {
        return (
            <div className="surface border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-primary">👋 Infera ITMS'e hoş geldiniz</p>
                    <p className="text-sm text-muted mt-0.5">
                        Başlamak için önce bir takım oluşturun, sonra bu takıma bağlı bir proje kurun.
                    </p>
                </div>
                {isAdmin && (
                    <Link to="/teams" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 whitespace-nowrap">
                        Takım Oluştur
                    </Link>
                )}
            </div>
        );
    }

    if (!status.isMemberOfAnyTeam) {
        return (
            <div className="surface border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-primary">Henüz bir takıma üye değilsiniz</p>
                <p className="text-sm text-muted mt-0.5">
                    Bir görev görebilmeniz için Admin ya da Project Manager sizi bir takıma eklemeli.
                </p>
            </div>
        );
    }

    if (!status.hasAnyProject) {
        return (
            <div className="surface border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-primary">Henüz bir proje yok</p>
                    <p className="text-sm text-muted mt-0.5">İlk projenizi oluşturarak görev takibine başlayın.</p>
                </div>
                <Link to="/projects" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 whitespace-nowrap">
                    Proje Oluştur
                </Link>
            </div>
        );
    }

    return null;
}