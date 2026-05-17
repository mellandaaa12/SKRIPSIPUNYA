"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { SideBarGuru } from "../components/SideBarGuru";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useProject } from "../context/ProjectContext";

const SINTAKS_NAMES = [
  "Orientasi Pada Masalah",
  "Menyusun Rencana Proyek",
  "Menyusun Jadwal",
  "Monitor Pelaksanaan Proyek",
  "Menguji Hasil",
  "Evaluasi Pengalaman",
  "Presentasi Hasil",
  "Refleksi dan Penutup",
];

export default function BuatSintaksGuru() {
  const navigate = useNavigate();
  const { kelasId, projectId } = useParams();
  const [searchParams] = useSearchParams();
  const sintaksNumber = parseInt(searchParams.get("number") || "1");
  const { preferences } = useSettings();
  const { addSintaks } = useProject();

  const [judulTugas, setJudulTugas] = useState("");
  const [deskripsiTugas, setDeskripsiTugas] = useState("");
  const [instruksiList, setInstruksiList] = useState<string[]>([""]);
  const [deliverableList, setDeliverableList] = useState<string[]>([""]);

  const sintaksNama = SINTAKS_NAMES[sintaksNumber - 1];

  const handleAddInstruksi = () => {
    setInstruksiList([...instruksiList, ""]);
  };

  const handleRemoveInstruksi = (index: number) => {
    if (instruksiList.length > 1) {
      setInstruksiList(instruksiList.filter((_, i) => i !== index));
    }
  };

  const handleUpdateInstruksi = (index: number, value: string) => {
    const newList = [...instruksiList];
    newList[index] = value;
    setInstruksiList(newList);
  };

  const handleAddDeliverable = () => {
    setDeliverableList([...deliverableList, ""]);
  };

  const handleRemoveDeliverable = (index: number) => {
    if (deliverableList.length > 1) {
      setDeliverableList(deliverableList.filter((_, i) => i !== index));
    }
  };

  const handleUpdateDeliverable = (index: number, value: string) => {
    const newList = [...deliverableList];
    newList[index] = value;
    setDeliverableList(newList);
  };

  const handleSimpan = () => {
    if (
      judulTugas &&
      deskripsiTugas &&
      instruksiList.every((i) => i) &&
      deliverableList.every((d) => d) &&
      projectId
    ) {
      addSintaks(projectId, {
        number: sintaksNumber,
        nama: sintaksNama,
        judulTugas,
        deskripsiTugas,
        instruksiList: instruksiList.filter((i) => i),
        deliverableList: deliverableList.filter((d) => d),
        status: "active",
      });
      navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}`);
    }
  };

  const isValid =
    judulTugas &&
    deskripsiTugas &&
    instruksiList.every((i) => i) &&
    deliverableList.every((d) => d);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-transparent w-[1440px] h-[1024px] relative overflow-hidden"
    >
      <SideBarGuru />

      {/* Header Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute left-[426px] top-[120px] w-[894px] h-[135px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]"
      >
        <button
          onClick={() => navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}`)}
          className="absolute left-[39px] top-[20px] flex items-center gap-[12px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white opacity-50" strokeWidth={2} />
          <p className="font-['Inter'] font-light text-[8px] text-white tracking-[-0.18px] opacity-50">
            Kembali Ke Detail Proyek
          </p>
        </button>

        <div className="absolute left-[39px] top-[45px]">
          <h1 className="font-['Lato'] font-bold text-[48px] text-white uppercase leading-[1.2]">
            TAMBAH TUGAS - SINTAKS {sintaksNumber}
          </h1>
          <p className="font-['Lato'] font-normal text-[16px] text-white capitalize leading-[1.4]">
            {sintaksNama}
          </p>
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute left-[426px] top-[268px] w-[894px] h-[636px] bg-white rounded-[25px] shadow-md overflow-hidden"
      >
        <div className="p-[40px] h-full overflow-y-auto">
          <div className="flex flex-col gap-[24px]">
            {/* Judul Tugas */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Judul Tugas <span className="text-[#e74c3c]">*</span>
              </label>
              <input
                type="text"
                value={judulTugas}
                onChange={(e) => setJudulTugas(e.target.value)}
                placeholder="Contoh: Analisis Masalah Website"
                className="h-[53px] px-[20px] py-[14px] border-2 border-[#e2e8f0] rounded-[12px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors"
              />
            </div>

            {/* Deskripsi Tugas */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                Deskripsi Tugas <span className="text-[#e74c3c]">*</span>
              </label>
              <textarea
                value={deskripsiTugas}
                onChange={(e) => setDeskripsiTugas(e.target.value)}
                placeholder="Jelaskan apa yang harus dikerjakan siswa..."
                className="h-[100px] px-[20px] py-[14px] border-2 border-[#e2e8f0] rounded-[12px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Instruksi Pengerjaan */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                  Instruksi Pengerjaan <span className="text-[#e74c3c]">*</span>
                </label>
                <button
                  onClick={handleAddInstruksi}
                  className="flex items-center gap-[8px] text-[#1294f2] hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-[14px] h-[14px]" />
                  <p className="font-['Poppins'] font-semibold text-[12px]">Tambah</p>
                </button>
              </div>
              {instruksiList.map((instruksi, index) => (
                <div key={index} className="flex items-start gap-[12px]">
                  <div className="w-[32px] h-[32px] flex-shrink-0 mt-[8px] bg-gradient-to-b from-[#1294f2] to-[#56B6C6] rounded-[8px] flex items-center justify-center">
                    <p className="font-['Poppins'] font-bold text-[13px] text-white">
                      {index + 1}
                    </p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={instruksi}
                      onChange={(e) => handleUpdateInstruksi(index, e.target.value)}
                      placeholder={`Instruksi ${index + 1}`}
                      className="w-full h-[49px] pl-[16px] pr-[40px] py-[12px] border-2 border-[#e2e8f0] rounded-[10px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors"
                    />
                    {instruksiList.length > 1 && (
                      <button
                        onClick={() => handleRemoveInstruksi(index)}
                        className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#ef4444] hover:bg-[#fee2e2] w-[24px] h-[24px] rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-[14px] h-[14px]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Yang Harus Dikumpulkan */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <label className="font-['Poppins'] font-semibold text-[14px] text-[#1e293b]">
                  Yang Harus Dikumpulkan <span className="text-[#e74c3c]">*</span>
                </label>
                <button
                  onClick={handleAddDeliverable}
                  className="flex items-center gap-[8px] text-[#46bd84] hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-[14px] h-[14px]" />
                  <p className="font-['Poppins'] font-semibold text-[12px]">Tambah</p>
                </button>
              </div>
              {deliverableList.map((deliverable, index) => (
                <div key={index} className="flex items-start gap-[12px]">
                  <div className="w-[32px] h-[32px] flex-shrink-0 mt-[8px] bg-gradient-to-b from-[#46bd84] to-[#34d399] rounded-[8px] flex items-center justify-center">
                    <p className="font-['Poppins'] font-bold text-[13px] text-white">
                      {String.fromCharCode(65 + index)}
                    </p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={deliverable}
                      onChange={(e) => handleUpdateDeliverable(index, e.target.value)}
                      placeholder={`Deliverable ${String.fromCharCode(65 + index)}`}
                      className="w-full h-[49px] pl-[16px] pr-[40px] py-[12px] border-2 border-[#e2e8f0] rounded-[10px] font-['Poppins'] text-[14px] text-[#1e293b] placeholder:text-[rgba(10,10,10,0.5)] focus:border-[#1294f2] focus:outline-none transition-colors"
                    />
                    {deliverableList.length > 1 && (
                      <button
                        onClick={() => handleRemoveDeliverable(index)}
                        className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#ef4444] hover:bg-[#fee2e2] w-[24px] h-[24px] rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-[14px] h-[14px]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-[12px] mt-[32px] pt-[24px] border-t border-[#e2e8f0]">
            <button
              onClick={() =>
                navigate(`/dashboard-guru/kelas/${kelasId}/project/${projectId}`)
              }
              className="flex-1 h-[41px] rounded-full border-2 border-[#1294f2] font-['Poppins'] font-semibold text-[14px] text-[#1294f2] hover:bg-[#f0f9ff] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSimpan}
              disabled={!isValid}
              className="flex-1 h-[41px] rounded-full bg-gradient-to-b from-[#46bd84] to-[#34d399] font-['Poppins'] font-semibold text-[14px] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Tugas
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
