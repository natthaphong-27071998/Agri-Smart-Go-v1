
import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';

const FeatureCard: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
        <div className="bg-green-100 p-4 rounded-full text-green-600 mb-4">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "h-8 w-8" })}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
);


const LandingPage: React.FC = () => {
    return (
        <div className="bg-gray-50 text-gray-800" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-2">
                        {React.cloneElement(ICONS.LEAF as React.ReactElement<any>, { className: "h-8 w-8 text-green-500" })}
                        <span className="text-2xl font-bold text-gray-800">Agri-Smart Go</span>
                    </Link>
                     <div className="flex items-center space-x-6">
                        <Link to="/how-to-use" className="font-semibold text-gray-600 hover:text-green-600 transition-colors">
                            วิธีใช้งาน
                        </Link>
                        <Link
                            to="/login"
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main>
                <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-white text-center">
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2940&auto=format&fit=crop"
                        alt="Modern Farm with technology"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-20 px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-shadow">
                            ปฏิวัติการทำฟาร์มของคุณด้วย Agri-Smart Go
                        </h1>
                        <p className="text-lg md:text-2xl max-w-3xl mx-auto mb-8 text-shadow-sm">
                            แพลตฟอร์มเดียวจบ ครบทุกเรื่องการจัดการฟาร์มอัจฉริยะ
                        </p>
                        <Link
                            to="/login"
                            className="px-10 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400 transition-transform duration-300 transform hover:scale-105 text-lg shadow-xl"
                        >
                            เริ่มต้นใช้งาน
                        </Link>
                    </div>
                </section>
                
                {/* Features Section */}
                <section id="features" className="py-20 bg-gray-100">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">ฟีเจอร์เด่นของเรา</h2>
                            <p className="text-gray-600 mt-2">เครื่องมือที่จะช่วยให้ฟาร์มของคุณเติบโตอย่างยั่งยืน</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <FeatureCard 
                                icon={ICONS.PRODUCTION}
                                title="การจัดการการผลิต"
                                description="วางแผนการเพาะปลูก ติดตามการเจริญเติบโต และจัดการกิจกรรมในแปลงได้อย่างมีประสิทธิภาพ"
                            />
                            <FeatureCard 
                                icon={ICONS.ACCOUNTING}
                                title="การบัญชีฟาร์ม"
                                description="บันทึกรายรับ-รายจ่าย จัดการสินทรัพย์และหนี้สิน พร้อมดูงบการเงินได้ทันที"
                            />
                            <FeatureCard 
                                icon={ICONS.SALES}
                                title="การตลาดและการขาย"
                                description="จัดการออเดอร์ ข้อมูลลูกค้า และสต็อกสินค้า พร้อมออกใบเสนอราคาและใบแจ้งหนี้"
                            />
                             <FeatureCard 
                                icon={React.cloneElement(ICONS.AI_ASSISTANT, { strokeWidth: "1" })}
                                title="ผู้ช่วย AI อัจฉริยะ"
                                description="รับคำแนะนำและข้อมูลเชิงลึกจาก 'น้องสมาร์ท' ผู้ช่วย AI ประจำฟาร์มของคุณ"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-green-700 text-white">
                    <div className="container mx-auto px-6 py-16 text-center">
                         <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            พร้อมที่จะยกระดับฟาร์มของคุณไปอีกขั้นแล้วหรือยัง?
                         </h2>
                        <p className="text-green-200 mb-8 max-w-2xl mx-auto">
                            เปลี่ยนข้อมูลในฟาร์มให้เป็นข้อมูลเชิงลึกที่นำไปใช้ได้จริง เพิ่มผลผลิต ลดต้นทุน และสร้างกำไรที่ยั่งยืน
                        </p>
                         <Link
                            to="/login"
                            className="px-8 py-3 bg-white text-green-700 font-bold rounded-full hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105 text-lg shadow-lg"
                        >
                            เข้าสู่ระบบเพื่อจัดการฟาร์ม
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 text-center p-4">
                <div className="container mx-auto">
                    &copy; {new Date().getFullYear()} Agri-Smart Go. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
