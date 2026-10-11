'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Briefcase,
  Users,
  ShieldCheck,
  Award,
  Calendar,
  Globe,
  Search,
} from 'lucide-react';

const PILOT_OFFICES = [
  { id: '65f000000000000000000001', name: 'PCMC Road Maintenance & Civil Department', nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग' },
  { id: '65f000000000000000000002', name: 'PCMC Water Supply & Drainage Department', nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग' },
  { id: '65f000000000000000000003', name: 'PCMC Health & Sanitation Department', nameMr: 'पिं.चिं.म.न.पा. मुख्य आरोग्य व घनकचरा व्यवस्थापन विभाग' },
  { id: '65f000000000000000000004', name: "PCMC Ward 'A' Zonal Office (Nigdi, Akurdi)", nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय (निगडी, आकुर्डी)' },
];

const PILOT_JURISDICTIONS = [
  { id: '65f000000000000000000010', name: 'PCMC Ward 12 (Nigdi - Pradhikaran)', code: 'Ward 12', level: 'ward' },
  { id: '65f000000000000000000011', name: 'AC-206 Pimpri Assembly Constituency', code: 'AC-206', level: 'assembly_constituency' },
  { id: '65f000000000000000000012', name: 'AC-205 Chinchwad Assembly Constituency', code: 'AC-205', level: 'assembly_constituency' },
  { id: '65f000000000000000000013', name: 'AC-207 Bhosari Assembly Constituency', code: 'AC-207', level: 'assembly_constituency' },
  { id: '65f000000000000000000014', name: 'PC-33 Maval Parliamentary Constituency', code: 'PC-33', level: 'parliamentary_constituency' },
  { id: '65f000000000000000000015', name: 'PC-34 Shirur Parliamentary Constituency', code: 'PC-34', level: 'parliamentary_constituency' },
];

function RequestAccessContent() {
  const router = useRouter();
  const { submitOfficeClaim, requestPhoneOtp } = useAuth();
  const { t, language } = useLanguage();

  // Affiliation Type
  const [affiliationType, setAffiliationType] = useState<'department' | 'agency' | 'representative'>('department');
  
  // Representative specific state
  const [isRepStaff, setIsRepStaff] = useState(false);
  const [repRole, setRepRole] = useState<'mla' | 'mp_lok_sabha' | 'ward_councillor' | 'sarpanch' | 'mlc' | 'mp_rajya_sabha' | 'minister' | 'chief_minister' | 'prime_minister' | 'other'>('mla');
  const [jurisdictions, setJurisdictions] = useState<any[]>(PILOT_JURISDICTIONS);
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState(PILOT_JURISDICTIONS[1].id);
  const [jurisdictionSearch, setJurisdictionSearch] = useState('');
  const [termStart, setTermStart] = useState('2024-11-01');
  const [termEnd, setTermEnd] = useState('2029-10-31');
  const [officialSiteUrl, setOfficialSiteUrl] = useState('');

  // General user details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Department office selection
  const [offices, setOffices] = useState(PILOT_OFFICES);
  const [selectedOfficeId, setSelectedOfficeId] = useState(PILOT_OFFICES[0].id);
  const [isOfficeNotListed, setIsOfficeNotListed] = useState(false);
  const [customOfficeName, setCustomOfficeName] = useState('');

  // Professional details
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Dynamic office list
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.offices) && d.offices.length > 0) {
          setOffices(d.offices.map((o: any) => ({ id: o._id, name: o.name, nameMr: o.nameMr || o.name })));
        }
      })
      .catch(() => {});

    // Dynamic jurisdictions list
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/jurisdictions`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.jurisdictions) && d.jurisdictions.length > 0) {
          setJurisdictions(d.jurisdictions.map((j: any) => ({ id: j._id, name: j.name, code: j.code, level: j.level })));
        }
      })
      .catch(() => {});
  }, []);

  // Update default designation when representative role changes
  useEffect(() => {
    if (affiliationType === 'representative') {
      const jur = jurisdictions.find((j) => j.id === selectedJurisdictionId);
      const jurName = jur?.code || jur?.name || 'Constituency';
      if (!isRepStaff) {
        setDesignation(`${repRole.toUpperCase().replace(/_/g, ' ')}, ${jurName}`);
      } else if (!designation || designation.includes('MLA') || designation.includes('MP')) {
        setDesignation(`Executive Assistant / PA to ${repRole.toUpperCase().replace(/_/g, ' ')}`);
      }
    }
  }, [affiliationType, isRepStaff, repRole, selectedJurisdictionId, jurisdictions]);

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Enter a valid 10-digit mobile number for 2-factor verification.');
      return;
    }
    setError('');
    setOtpLoading(true);
    const res = await requestPhoneOtp(`+91${cleanPhone.slice(-10)}`);
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
    } else {
      setError(res.message || 'Failed to send verification OTP.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !designation.trim()) {
      setError('Please fill in all required official details.');
      return;
    }

    if (!otpSent || otp.length < 6) {
      setError('Please verify your mobile number with the 6-digit OTP code.');
      return;
    }

    if (!file) {
      setError(
        affiliationType === 'representative'
          ? 'Please attach appointment/election certificate or official letter on letterhead (PDF, PNG, JPG, Max 5MB).'
          : 'Please attach official ID card, appointment order, or contractor work order document (Max 5MB).'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Document file size must not exceed 5MB.');
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('email', email.trim());
    fd.append('password', password);
    fd.append('phone', `+91${phone.replace(/\D/g, '').slice(-10)}`);
    fd.append('otp', otp);
    fd.append('designation', designation.trim());

    if (affiliationType === 'representative') {
      const accountType = isRepStaff ? 'representative_staff' : 'representative';
      fd.append('accountType', accountType);
      fd.append('role', 'official');
      fd.append('representativeRole', repRole);
      fd.append('jurisdictionId', selectedJurisdictionId);
      fd.append('termStart', termStart);
      fd.append('termEnd', termEnd);
      if (officialSiteUrl.trim()) fd.append('officialSiteUrl', officialSiteUrl.trim());
      fd.append('isStaff', isRepStaff ? 'true' : 'false');
      if (claimNotes.trim()) fd.append('claimNotes', claimNotes.trim());
    } else {
      const accountType = affiliationType === 'agency' ? 'agency_contractor' : 'department_official';
      fd.append('accountType', accountType);
      fd.append('role', affiliationType === 'agency' ? 'agency' : 'official');
      fd.append('officeId', isOfficeNotListed ? '65f000000000000000000004' : selectedOfficeId);
      if (employeeId.trim()) fd.append('employeeId', employeeId.trim());
      if (customOfficeName.trim()) {
        fd.append('claimNotes', `[Custom Office Request: ${customOfficeName}] ${claimNotes.trim()}`);
      } else if (claimNotes.trim()) {
        fd.append('claimNotes', claimNotes.trim());
      }
    }

    fd.append('document', file);

    const res = await submitOfficeClaim(fd);
    setLoading(false);

    if (res.success) {
      const claimId = res.claimId || `CLM-${Date.now().toString().slice(-6)}`;
      router.push(`/office/request-status?id=${encodeURIComponent(claimId)}&email=${encodeURIComponent(email)}`);
    } else {
      setError(res.message || 'Failed to submit access request. Please check details.');
    }
  };

  const filteredJurisdictions = jurisdictions.filter((j) => {
    if (!jurisdictionSearch.trim()) return true;
    const q = jurisdictionSearch.toLowerCase();
    return (
      (j.name && j.name.toLowerCase().includes(q)) ||
      (j.code && j.code.toLowerCase().includes(q)) ||
      (j.level && j.level.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link
          href="/office/sign-in"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-900 transition mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Office Sign In</span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('requestAccessBtn')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Official onboarding for municipal departments, contractors, and elected representatives across Maharashtra.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Affiliation Type Selector: 3 Options */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Select Public Role / Affiliation Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAffiliationType('department')}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                affiliationType === 'department'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 ring-2 ring-blue-900/10'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
              <span>{t('officeTypeOfficial')}</span>
            </button>

            <button
              type="button"
              onClick={() => setAffiliationType('representative')}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                affiliationType === 'representative'
                  ? 'border-purple-900 bg-purple-50 text-purple-900 ring-2 ring-purple-900/10'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Award className="w-4 h-4 text-purple-900 shrink-0" />
              <span>Elected Representative</span>
            </button>

            <button
              type="button"
              onClick={() => setAffiliationType('agency')}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                affiliationType === 'agency'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 ring-2 ring-blue-900/10'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-blue-900 shrink-0" />
              <span>{t('officeTypeAgency')}</span>
            </button>
          </div>
        </div>

        {/* ELECTED REPRESENTATIVE SECTION */}
        {affiliationType === 'representative' && (
          <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-800" />
              <h2 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                Elected Public Representative Credentials
              </h2>
            </div>

            {/* Representative vs Staff Toggle */}
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-1 rounded-xl border border-purple-200">
              <button
                type="button"
                onClick={() => setIsRepStaff(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  !isRepStaff
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I am the Elected Representative
              </button>
              <button
                type="button"
                onClick={() => setIsRepStaff(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  isRepStaff
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I work in the Representative&apos;s Office (Staff)
              </button>
            </div>

            {/* Role & Constituency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Representative Role *
                </label>
                <select
                  value={repRole}
                  onChange={(e) => setRepRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                >
                  <option value="mla">MLA (Member of Legislative Assembly)</option>
                  <option value="mp_lok_sabha">MP (Lok Sabha)</option>
                  <option value="ward_councillor">Ward Councillor / Corporator</option>
                  <option value="sarpanch">Gram Panchayat Sarpanch</option>
                  <option value="mlc">MLC (Legislative Council)</option>
                  <option value="mp_rajya_sabha">MP (Rajya Sabha)</option>
                  <option value="minister">Cabinet / State Minister</option>
                  <option value="chief_minister">Chief Minister&apos;s Office</option>
                  <option value="prime_minister">Prime Minister&apos;s Office</option>
                  <option value="other">Other Public Representative Role</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Constituency / Jurisdiction *
                </label>
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search constituency or ward..."
                      value={jurisdictionSearch}
                      onChange={(e) => setJurisdictionSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-700 mb-1"
                    />
                  </div>
                  <select
                    value={selectedJurisdictionId}
                    onChange={(e) => setSelectedJurisdictionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-medium"
                  >
                    {filteredJurisdictions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.code ? `[${j.code}] ` : ''}{j.name} ({j.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Term Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Term Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={termStart}
                  onChange={(e) => setTermStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Term End Date *
                </label>
                <input
                  type="date"
                  required
                  value={termEnd}
                  onChange={(e) => setTermEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
            </div>

            {/* Official Website URL */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Official Public Page / Directory Link (Optional)
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={officialSiteUrl}
                  onChange={(e) => setOfficialSiteUrl(e.target.value)}
                  placeholder="https://eci.gov.in or https://assembly.gov.in"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
            </div>

            {/* Neutrality Safeguard Callout */}
            <div className="p-3 bg-purple-100/60 rounded-xl border border-purple-200 text-[11px] text-purple-950 leading-relaxed">
              <strong>Neutrality Notice:</strong> RAISE is strictly non-partisan. Political party affiliation, party symbols, and logos are neither collected nor displayed. All representatives and offices receive equal platform access and identical verified metrics computed from citizen-confirmed resolutions.
            </div>
          </div>
        )}

        {/* DEPARTMENT / AGENCY OFFICE SELECTOR */}
        {affiliationType !== 'representative' && (
          <div>
            <label htmlFor="claim-office-select" className="block text-xs font-bold text-gray-700 mb-1">
              Department / Office Directory
            </label>
            {!isOfficeNotListed ? (
              <select
                id="claim-office-select"
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {language === 'mr' ? o.nameMr : o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={customOfficeName}
                onChange={(e) => setCustomOfficeName(e.target.value)}
                placeholder="e.g. PCMC Electricity & Streetlights Dept"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            )}

            <div className="flex items-center gap-2 mt-2">
              <input
                id="office-not-listed"
                type="checkbox"
                checked={isOfficeNotListed}
                onChange={(e) => setIsOfficeNotListed(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-900 focus:ring-blue-900 border-gray-300 cursor-pointer"
              />
              <label htmlFor="office-not-listed" className="text-xs text-gray-600 cursor-pointer select-none">
                My office / division is not listed above
              </label>
            </div>
          </div>
        )}

        {/* Official Name & Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="claim-name" className="block text-xs font-bold text-gray-700 mb-1">
              {affiliationType === 'representative' && !isRepStaff ? 'Representative Full Name *' : 'Applicant Full Name *'}
            </label>
            <input
              id="claim-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunil K. Jagtap"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label htmlFor="claim-designation" className="block text-xs font-bold text-gray-700 mb-1">
              {affiliationType === 'representative' ? 'Official Public Title *' : `${t('designationLabel')} *`}
            </label>
            <input
              id="claim-designation"
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder={
                affiliationType === 'representative'
                  ? 'e.g. MLA, AC-206 Pimpri'
                  : 'e.g. Junior Engineer / Supervisor'
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Work Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="claim-email" className="block text-xs font-bold text-gray-700 mb-1">
              Official Email Address *
            </label>
            <input
              id="claim-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@pcmc.gov.in"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label htmlFor="claim-password" className="block text-xs font-bold text-gray-700 mb-1">
              Set Portal Password *
            </label>
            <input
              id="claim-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Phone & OTP Verification */}
        <div>
          <label htmlFor="claim-phone" className="block text-xs font-bold text-gray-700 mb-1">
            Mobile Number (for SMS & 2FA Verification) *
          </label>
          <div className="flex gap-2">
            <input
              id="claim-phone"
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading || phone.length < 10}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>

          {otpSent && (
            <div className="mt-2">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP (e.g. 123456)"
                className="w-full text-center font-mono tracking-widest px-3 py-2 text-sm rounded-xl border border-blue-300 bg-blue-50/30 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          )}
        </div>

        {/* Supporting Evidence Document Upload */}
        <div>
          <label htmlFor="claim-file" className="block text-xs font-bold text-gray-700 mb-1">
            {affiliationType === 'representative'
              ? 'Supporting Evidence (Appointment/Election Certificate or Official Letter) *'
              : 'Supporting Document (Official ID / Work Order) *'}
          </label>
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-700 transition bg-gray-50/50">
            <input
              id="claim-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="claim-file" className="cursor-pointer block">
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <span className="text-xs font-bold text-blue-900 block">
                {file ? file.name : 'Choose file (PDF, PNG, JPEG)'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Maximum size: 5 MB</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="claim-notes" className="block text-xs font-bold text-gray-700 mb-1">
            {affiliationType === 'representative'
              ? 'Additional Constituency or Office Notes (Optional)'
              : 'Brief Statement of Responsibilities (Optional)'}
          </label>
          <textarea
            id="claim-notes"
            rows={2}
            value={claimNotes}
            onChange={(e) => setClaimNotes(e.target.value)}
            placeholder={
              affiliationType === 'representative'
                ? 'e.g. Official constituency contact details, public grievance office address.'
                : 'e.g. In charge of road surfacing and pothole repair for Ward 10.'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full min-h-[44px] py-3 px-4 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 ${
            affiliationType === 'representative'
              ? 'bg-purple-900 hover:bg-purple-800 shadow-purple-900/20'
              : 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Submit Request for Verification</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function RequestAccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading form...</div>}>
      <RequestAccessContent />
    </Suspense>
  );
}
