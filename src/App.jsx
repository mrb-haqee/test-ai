import { useState } from 'react'
import axios from 'axios'
import './App.css'

const CLASSES = [
  'Covid-19',
  'Pneumonia',
  'Atercelesis',
  'Pneumothorax',
  'Normal',
]

function App() {
  const [data, setData] = useState({
    img: null,
    tempPath: '',
    size: ''
  })
  
  const [statusResult, setStatusResult] = useState({
    loading: false,
    submitted: false,
    result: null
  })
  
  const [reportSections, setReportSections] = useState({
    findings: '',
    impression: ''
  })

  const splitReport = (reportText) => {
    if (!reportText) return { findings: '', impression: '' };
    
    // Replace escaped newlines with actual newlines
    const cleanedText = reportText.replace(/\\n/g, '\n');
    
    const sections = {};
    const sectionTitles = ['FINDINGS:', 'IMPRESSION:'];
    
    sectionTitles.forEach((title, index) => {
      const start = cleanedText.indexOf(title);
      if (start !== -1) {
        const nextTitle = index < sectionTitles.length - 1 
          ? cleanedText.indexOf(sectionTitles[index + 1]) 
          : cleanedText.length;
        
        const sectionContent = cleanedText.substring(start + title.length, nextTitle).trim();
        const sectionKey = title.replace(':', '').toLowerCase();
        
        sections[sectionKey] = sectionContent;
      }
    });
    
    return sections;
  };

  const handleChecking = (e) => {
    e.preventDefault();
    setStatusResult(prev => ({ ...prev, loading: true }))
    
    const formData = new FormData();
    formData.append("file", data.img);

    axios.post('https://HaiMax2007-5-chest-disease-classification.hf.space/upload-image', formData, {
      headers: {
        "Content-Type": 'multipart/form-data'
      }
    })
    .then(res => {
      setStatusResult(prev => ({...prev, result: res.data, submitted: true}))
      
      // Parse the report sections when we get the result
      if (res.data.report) {
        const sections = splitReport(res.data.report);
        setReportSections(sections);
      }
    })
    .catch(e => console.log(e))
    .finally(() => {
      setStatusResult(prev => ({ ...prev, loading: false }))
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return;
    
    const size = file.size > 1048576 ? file.size/(1024**2) : file.size/1024
    const byte = file.size > 1048576 ? 'MB' : 'KB'

    setData({...data, img: file, tempPath: URL.createObjectURL(file), size: `${size.toFixed(2).toString()} ${byte}`})
  }

  const handleDeleteImage = () => {
    setData({img: null, tempPath: '', size: ''})
    setStatusResult({loading: false, submitted: false, result: null})
    setReportSections({findings: '', impression: ''})
  }

  // Extract confidence score from impression text
  const extractConfidence = (impressionText) => {
    if (!impressionText) return null;
    const confidenceMatch = impressionText.match(/(\d+\.\d+)% confidence/);
    return confidenceMatch ? parseFloat(confidenceMatch[1]) : null;
  };

  const confidenceScore = extractConfidence(reportSections.impression || '');
  
  return (
    <>
      <div className="w-full bg-white p-8 flex flex-col items-center gap-8">
        <div className="space-y-0.5">
          <h1 className='text-3xl text-blue-700 capitalize font-semibold text-center'>AI identifikasi <span className='font-bold text-5xl'>5</span> penyakit paru paru</h1>
          <div className='flex gap-8 justify-center border-[2px] border-blue-500 px-5'>
            {CLASSES.map((c, index) => <span key={index}>{c}</span>)}
          </div>
        </div>
        <p className='text-center max-w-2xl'>Upload gambar X-ray untuk analisis menggunakan kecerdasan buatan yang canggih dan dapatkan hasil diagnosis dalam hitungan detik</p>
      </div>
      
      {statusResult.loading ? (
        <div className="h-screen flex flex-col justify-center items-center gap-8">
          <img src="/logo.png" alt="logo" className='animate-bounce' />
          <span className='capitalize font-semibold'>analyzing the image . . .</span>
        </div>
      ) : statusResult.result && statusResult.submitted ? (
        <div className="flex flex-col items-center justify-center p-8 gap-8">
          <div className="flex flex-col md:flex-row items-start gap-8 w-full max-w-6xl">
            <div className="w-full md:w-1/2">
              <h3 className='capitalize font-semibold mb-4'>gambar x-ray</h3>
              <img src={data.tempPath} alt={data.img?.name} className='w-full h-auto max-h-96 object-contain rounded-lg shadow-md' />
            </div>
            
            <div className="w-full md:w-1/2 space-y-8">
              <div className="bg-blue-50 border-blue-500 border p-5 rounded-lg">
                <span className='text-sm text-blue-700'>Hasil analisis di bawah ini adalah simulasi untuk tujuan demo. Konsultasikan dengan dokter untuk diagnosis yang akurat. Deteksi Penyakit</span>
              </div>
              
              <div className="space-y-5 p-5 shadow-xl rounded-lg">
                <h3 className='capitalize font-semibold'>deteksi penyakit</h3>
                <div className="space-y-3">
                  {statusResult.result.classification && statusResult.result.classification.map((c, index) => (
                    <div key={index} className={`flex justify-between items-center border rounded-xl py-2 px-4 text-sm ${
                      index === 0 ? 'bg-green-100 border-green-700' : 'bg-orange-100 border-orange-500'
                    }`}>
                      <span className='font-bold'>{c.condition}</span>
                      <span className='capitalize'>confidence <span className='text-xl font-semibold'>{c.confidence}%</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {statusResult.result.report && (
            <div className="medical-report w-full max-w-6xl bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-blue-800 mb-6 border-b pb-2">Medical Report Analysis</h2>
              
              <div className="report-section findings mb-6 p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Findings</h3>
                <p className="text-gray-700 whitespace-pre-line">{reportSections.findings}</p>
              </div>
              
              <div className="report-section impression mb-6 p-4 border-l-4 border-red-500 bg-red-50 rounded">
                <h3 className="text-xl font-semibold text-red-700 mb-2">Impression</h3>
                <ul className="list-disc pl-5">
                  {reportSections.impression && reportSections.impression.split('\n')
                    .filter(line => line.trim().startsWith('*'))
                    .map((item, index) => (
                      <li key={index} className="text-gray-700 mb-1">{item.replace('*', '').trim()}</li>
                    ))
                  }
                </ul>
                
                {confidenceScore && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-semibold text-yellow-800">AI Confidence Level</h4>
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                      <div 
                        className={`${confidenceScore > 50 ? 'bg-green-500' : 'bg-yellow-500'} h-4 rounded-full flex items-center justify-center text-xs font-bold text-white`} 
                        style={{ width: `${confidenceScore}%` }}
                      >
                        {confidenceScore}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleDeleteImage}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded cursor-pointer"
              >
                Analisis Gambar Baru
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#F0F8FF] min-h-screen py-5 flex justify-center items-center">
          <form className='bg-white min-w-[300px] max-w-2xl w-full text-center p-5 rounded-lg flex flex-col justify-center items-center gap-8' encType='multipart/form-data'>
            <div>
              <h2 className='capitalize text-blue-700 text-xl font-bold '>upload gambar x-ray paru - paru</h2>
              <p className='capitalize'>pilih file untuk memulai analisis AI</p>
            </div>
            
            <div className={`border-dashed border-2 border-blue-100 hover:border-blue-700 transition flex flex-col justify-center w-full items-center rounded-2xl overflow-hidden ${!data.img && 'h-80'}`}>
              {data.tempPath ? (
                <>
                  <img src={data.tempPath} alt={data.img?.name} className='w-full h-80 object-contain' />
                  <div className="bg-[#F0F8FF] w-full px-5 py-3 rounded-lg flex justify-between gap-3 mt-4">
                    <img src="/file.png" alt="file" className='w-6' />
                    <span className="truncate">{data.img?.name}</span>
                    <span className="text-gray-500">{data.size}</span>
                  </div>
                </>
              ) : (
                <>
                  <img src="/download.png" alt="download" className='animate-bounce w-24' />
                  <h3 className='capitalize font-semibold mt-4'>please select an image by clicking the button below!</h3>
                  <label htmlFor="img" className='mt-5 rounded-lg capitalize bg-blue-700 hover:bg-blue-500 cursor-pointer transition text-white py-2 px-5 font-semibold'>
                    pilih file dari komputer
                    <input className='hidden' id='img' type="file" accept='image/*' onChange={handleImageChange} />
                  </label>
                </>
              )}
            </div>
            
            <div className="w-full flex flex-col gap-2">
              <button 
                type="button" 
                className={`text-center p-2 ${data.img ? 'bg-red-500 hover:bg-red-700 cursor-pointer' : 'bg-red-300'} text-white rounded-xl capitalize w-full font-semibold transition`} 
                onClick={handleDeleteImage} 
                disabled={!data.img}
              >
                delete image
              </button>
              
              <button 
                type='button' 
                className={`text-center p-2 ${data.img ? 'bg-blue-700 hover:bg-blue-500 cursor-pointer' : 'bg-blue-300'} text-white rounded-xl capitalize w-full font-semibold transition`} 
                onClick={handleChecking} 
                disabled={!data.img}
              >
                analisis dengan AI
              </button>
            </div>
            
            <ul className='pl-10 list-disc self-start text-left bg-[#F0F8FF] p-3 text-blue-700 rounded'>
              <li className='font-semibold'>Format yang didukung</li>
              <li className='list-none'>JPG, PNG, JPEG (Maksimal 10MB)</li>
            </ul>
          </form>
        </div>
      )}
      
      <div className="w-full flex justify-center p-8 bg-gray-100">
        <span>© 2025 AI Lung Disease Detection. Untuk tujuan edukasi dan demo.</span>
      </div>
    </>
  )
}

export default App