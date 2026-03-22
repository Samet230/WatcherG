// WatcherG — Dashboard sayfası (Ana ekran)
// GlobeContainer ile 2D/3D harita görünümü, V3 Command Center

import GlobeContainer from "@/components/Globe/GlobeContainer";
import DashboardLayout from "@/components/Dashboard/Layout";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <GlobeContainer />
        </DashboardLayout>
    );
}
