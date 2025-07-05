
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ICONS } from '../constants';

const FeatureGuideCard: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-start space-x-4">
        <div className="bg-green-100 p-3 rounded-full text-green-600 flex-shrink-0 mt-1">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6" })}
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);

const HowToUsePage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <ReactRouterDOM.Link to="/" className="flex items-center space-x-2">
                        {React.cloneElement(ICONS.LEAF as React.ReactElement<any>, { className: "h-8 w-8 text-green-500" })}
                        <span className="text-2xl font-bold text-gray-800">Agri-Smart Go</span>
                    </ReactRouterDOM.Link>
                    <ReactRouterDOM.Link
                        to="/"
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
                    >
                        กลับหน้าหลัก
                    </ReactRouterDOM.Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-800">วิธีใช้งาน Agri-Smart Go</h1>
                    <p className="text-lg text-gray-600 mt-2">คู่มือการใช้งานแต่ละส่วนของแอปพลิเคชัน</p>
                </div>

                <div className="max-w-4xl mx-auto mb-10">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-md">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-full mr-4">
                                {ICONS.DATABASE}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-blue-800">เริ่มต้นการตั้งค่า (สำคัญมาก)</h3>
                                <p className="text-blue-700 mt-1">สำหรับผู้ใช้งานครั้งแรก กรุณาไปที่หน้าตั้งค่าเพื่อรับสคริปต์สำหรับสร้างฐานข้อมูลใน Supabase ของคุณก่อน</p>
                            </div>
                            <ReactRouterDOM.Link to="/setup" className="ml-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 whitespace-nowrap transition-transform transform hover:scale-105">
                                ไปที่หน้าตั้งค่า
                            </ReactRouterDOM.Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <FeatureGuideCard
                        icon={ICONS.DASHBOARD}
                        title="แดชบอร์ด"
                        description="ภาพรวมข้อมูลสำคัญของฟาร์ม เช่น รายรับ-รายจ่าย, ข้อมูลเซ็นเซอร์, และสถานะออเดอร์ เพื่อให้คุณเห็นภาพรวมและตัดสินใจได้อย่างรวดเร็ว"
                    />
                    <FeatureGuideCard
                        icon={ICONS.PRODUCTION}
                        title="การจัดการการผลิต"
                        description="วางแผนการเพาะปลูก, บันทึกกิจกรรมต่างๆ ในแปลง (เช่น การรดน้ำ, ใส่ปุ๋ย), ติดตามสถานะของแต่ละแปลง และดูข้อมูลจากเซ็นเซอร์ IoT"
                    />
                    <FeatureGuideCard
                        icon={ICONS.HR}
                        title="การจัดการพนักงาน"
                        description="จัดเก็บทะเบียนประวัติของพนักงานทั้งหมดในฟาร์ม, แก้ไขข้อมูล, และเปลี่ยนสถานะการทำงาน (เช่น ทำงาน, ลาออก)"
                    />
                    <FeatureGuideCard
                        icon={ICONS.ACCOUNTING}
                        title="การบัญชีฟาร์ม"
                        description="บันทึกรายรับ-รายจ่ายประจำวัน, ดูผังบัญชี, จัดการบัญชีลูกหนี้-เจ้าหนี้, และดูงบการเงินเบื้องต้นของฟาร์ม"
                    />
                    <FeatureGuideCard
                        icon={ICONS.SALES}
                        title="การตลาดและการขาย"
                        description="สร้างใบเสนอราคา, จัดการคำสั่งซื้อของลูกค้า, ดูข้อมูลลูกค้า (CRM), และติดตามสินค้าคงคลัง พร้อมส่งออกเอกสารเป็น PDF/DOC"
                    />
                     <FeatureGuideCard
                        icon={ICONS.INVESTMENT}
                        title="การลงทุนและความเสี่ยง"
                        description="วางแผนและติดตามโครงการลงทุนต่างๆ เพื่อการเติบโตของฟาร์ม พร้อมทั้งประเมินและบันทึกความเสี่ยงที่อาจเกิดขึ้นและแนวทางป้องกัน"
                    />
                     <FeatureGuideCard
                        icon={ICONS.REPORTS}
                        title="รายงาน"
                        description="สร้างรายงานสรุปในด้านต่างๆ เช่น รายงานการขาย, รายงานการเงิน, และรายงานบุคลากร สามารถกรองข้อมูลตามช่วงเวลาและส่งออกเป็นไฟล์ PDF หรือ CSV"
                    />
                     <FeatureGuideCard
                        icon={ICONS.ADMIN}
                        title="ผู้ดูแลระบบ"
                        description="จัดการข้อมูลหลักของบริษัท, จัดการรายชื่อผู้ใช้งานและกำหนดบทบาท, รวมถึงตั้งค่าสิทธิ์การเข้าถึงข้อมูลในแต่ละโมดูล"
                    />
                    <FeatureGuideCard
                        icon={React.cloneElement(ICONS.AI_ASSISTANT, { strokeWidth: "1.5" })}
                        title="ผู้ช่วย AI อัจฉริยะ"
                        description="คลิกที่ไอคอน AI เพื่อปรึกษา 'น้องสมาร์ท' ผู้ช่วยอัจฉริยะ สามารถสอบถามได้ทุกเรื่องที่เกี่ยวกับการเกษตร, การตลาด, และการจัดการฟาร์ม"
                    />
                </div>
                 <div className="text-center mt-16 space-y-6">
                    <ReactRouterDOM.Link to="/login" className="px-10 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400 transition-transform duration-300 transform hover:scale-105 text-lg shadow-lg inline-block">
                        เริ่มจัดการฟาร์มของคุณ
                    </ReactRouterDOM.Link>
                    <div>
                        <ReactRouterDOM.Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-300 transition-colors">
                            &larr; หรือกลับสู่หน้าหลัก
                        </ReactRouterDOM.Link>
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 text-center p-4 mt-12">
                <div className="container mx-auto">
                    &copy; {new Date().getFullYear()} Agri-Smart Go. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default HowToUsePage;
