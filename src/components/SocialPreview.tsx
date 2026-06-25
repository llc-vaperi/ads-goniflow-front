"use client";

import React from "react";
import { GeneratedAd } from "../utils/mockGenerator";

interface SocialPreviewProps {
  platform: string;
  ad: GeneratedAd | null;
  userEmail: string;
}

export default function SocialPreview({ platform, ad, userEmail }: SocialPreviewProps) {
  const userName = userEmail ? userEmail.split("@")[0] : "მომხმარებელი";
  const userAvatarChar = userName.charAt(0).toUpperCase();

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 min-h-[300px]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-3 text-slate-600 animate-pulse">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-sm font-medium">შეიყვანეთ ტექსტი მარცხნივ და დააჭირეთ გენერირებას პოსტის სანახავად</p>
      </div>
    );
  }

  const renderFacebook = () => {
    return (
      <div className="bg-[#18191a] text-[#e4e6eb] rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans">
        {/* Profile Info */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {userAvatarChar}
            </div>
            <div>
              <div className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-1.5">
                {userName}
                <span className="text-[11px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">Sponsored</span>
              </div>
              <div className="text-[12px] text-[#b0b3b8] flex items-center gap-1">
                <span>ახლახანს</span>
                <span>•</span>
                <svg className="w-3.5 h-3.5 fill-[#b0b3b8]" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
                  <path d="M8.5 4h-1v4.5l3.5 2 .5-.8-3-1.7V4z" />
                </svg>
              </div>
            </div>
          </div>
          <button className="text-[#b0b3b8] hover:bg-[#3a3b3c] p-1.5 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" />
            </svg>
          </button>
        </div>

        {/* Text Content */}
        <div className="px-4 pb-3 text-[15px] whitespace-pre-line leading-relaxed">
          {ad.text}
          <div className="mt-2 text-[#385898] hover:underline font-normal text-sm flex flex-wrap gap-1">
            {ad.hashtags.join(" ")}
          </div>
        </div>

        {/* Image / Link Area */}
        <div className="border-t border-b border-[#242526] bg-[#242526]">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt="Facebook Ad Preview" 
              className="w-full h-[240px] object-cover" 
            />
          )}
          <div className="p-3 bg-[#242526] flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[12px] text-[#b0b3b8] uppercase tracking-wider block truncate">GONIFLOW.GE</span>
              <span className="font-semibold text-[16px] text-white block truncate mt-0.5">{ad.headline || "ინოვაციური პროდუქტი"}</span>
            </div>
            <button className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white font-semibold text-[14px] px-4 py-2 rounded-lg shrink-0 transition-colors">
              {ad.cta}
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-4 py-2 text-[13px] text-[#b0b3b8] flex items-center justify-between border-b border-[#242526]">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600">
              <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </span>
            <span>42 Likes</span>
          </div>
          <span>12 Comments</span>
        </div>

        <div className="p-1 flex items-center justify-around text-[#b0b3b8] font-semibold text-[13px]">
          <button className="flex items-center justify-center gap-2 hover:bg-[#242526] py-2 flex-1 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.896 0 1.7.393 2.285 1.024v-3.725C8.918 5.5 10.668 3.5 12 3.5c1.332 0 3.082 2 3.082 4.049v3.725a3.2 3.2 0 0 1 2.285-1.024 3.2 3.2 0 1 1 0 6.4c-.896 0-1.7-.393-2.285-1.024v1.1c0 2.05-1.75 4.05-3.082 4.05-1.332 0-3.082-2-3.082-4.05v-1.1a3.2 3.2 0 0 1-2.285 1.024 3.2 3.2 0 1 1 0-6.4Z" />
            </svg>
            Like
          </button>
          <button className="flex items-center justify-center gap-2 hover:bg-[#242526] py-2 flex-1 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
            Comment
          </button>
        </div>
      </div>
    );
  };

  const renderInstagram = () => {
    return (
      <div className="bg-black text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600">
              <div className="w-full h-full rounded-full bg-black border border-black flex items-center justify-center font-bold text-xs">
                {userAvatarChar}
              </div>
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1">
                {userName}
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Sponsored</span>
            </div>
          </div>
          <button className="text-white hover:text-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>
        </div>

        {/* Main Post Image */}
        <div className="relative aspect-square bg-[#121212]">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt="Instagram Ad Preview" 
              className="w-full h-full object-cover" 
            />
          )}
        </div>

        {/* CTA Bar */}
        <div className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 flex items-center justify-between cursor-pointer transition-colors">
          <span>{ad.cta}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="hover:scale-110 transition-transform text-rose-500">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
              <button className="hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48L4.5 20.25l3.227-1.076a10.124 10.124 0 004.273 1.076z" /></svg>
              </button>
            </div>
            <button className="hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
            </button>
          </div>

          <div className="font-bold text-xs">842 likes</div>

          {/* Caption */}
          <div className="text-xs space-y-1">
            <p className="leading-relaxed">
              <span className="font-bold mr-1.5">{userName}</span>
              <span className="whitespace-pre-line text-slate-200">{ad.text}</span>
            </p>
            <div className="text-indigo-400 font-medium flex flex-wrap gap-1 mt-1.5">
              {ad.hashtags.join(" ")}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 uppercase font-semibold pt-1">
            1 Hour Ago
          </div>
        </div>
      </div>
    );
  };

  const renderLinkedIn = () => {
    return (
      <div className="bg-[#1d2226] text-[#e9ecef] rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-800 flex items-center justify-center font-bold text-white text-base shrink-0">
              {userAvatarChar}
            </div>
            <div>
              <div className="font-bold text-sm hover:underline cursor-pointer flex items-center gap-1.5">
                {userName}
                <span className="text-xs text-slate-400">• 1st</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-[200px] truncate">Post Content Specialist</p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span>ახლახანს</span>
                <span>•</span>
                <span>Promoted</span>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <div className="px-4 pb-3 text-[14px] whitespace-pre-line leading-relaxed text-slate-200">
          {ad.text}
          <div className="mt-2 text-indigo-400 font-semibold flex flex-wrap gap-1">
            {ad.hashtags.join(" ")}
          </div>
        </div>

        {/* Image Card */}
        <div className="bg-[#121619] border-t border-b border-slate-800 cursor-pointer">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt="LinkedIn Ad Preview" 
              className="w-full h-[220px] object-cover" 
            />
          )}
          <div className="p-3 bg-[#121619] border-t border-slate-800">
            <span className="font-bold text-sm block truncate text-slate-200">{ad.headline || "ბიზნეს გადაწყვეტილება"}</span>
            <div className="flex items-center justify-between gap-4 mt-2">
              <span className="text-xs text-slate-400">goniflow.ge</span>
              <button className="border border-indigo-400 text-indigo-400 hover:bg-indigo-400/10 font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors">
                {ad.cta}
              </button>
            </div>
          </div>
        </div>

        {/* Reaction info */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <span className="bg-blue-600 text-white rounded-full p-0.5 flex items-center justify-center w-3.5 h-3.5">👍</span>
            <span className="bg-emerald-600 text-white rounded-full p-0.5 flex items-center justify-center w-3.5 h-3.5">👏</span>
            <span>18 Reactions</span>
          </div>
          <span>3 Comments</span>
        </div>

        {/* Action buttons */}
        <div className="px-2 py-1 flex items-center justify-between text-slate-400 font-semibold text-xs">
          <button className="flex items-center justify-center gap-2 hover:bg-slate-800 py-2.5 px-3 rounded-lg transition-colors flex-1">
            👍 Like
          </button>
          <button className="flex items-center justify-center gap-2 hover:bg-slate-800 py-2.5 px-3 rounded-lg transition-colors flex-1">
            💬 Comment
          </button>
          <button className="flex items-center justify-center gap-2 hover:bg-slate-800 py-2.5 px-3 rounded-lg transition-colors flex-1">
            🔁 Share
          </button>
        </div>
      </div>
    );
  };

  const renderX = () => {
    return (
      <div className="bg-black text-[#e7e9ea] p-4 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans space-y-3">
        {/* Profile */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {userAvatarChar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] hover:underline cursor-pointer">{userName}</span>
                <span className="text-[14px] text-slate-500">@{userName.toLowerCase()}</span>
                <span className="text-[14px] text-slate-500">·</span>
                <span className="text-[14px] text-slate-500">Ad</span>
              </div>
              {/* Text */}
              <p className="text-[15px] leading-relaxed whitespace-pre-line mt-1 text-slate-100">
                {ad.text}
              </p>
              <div className="mt-1.5 text-sky-500 flex flex-wrap gap-1 text-[14px]">
                {ad.hashtags.join(" ")}
              </div>
            </div>
          </div>
          <button className="text-slate-500 hover:text-sky-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" />
            </svg>
          </button>
        </div>

        {/* Link / Image Block */}
        <div className="ml-13 border border-slate-800 rounded-2xl overflow-hidden bg-[#0c0d0e] cursor-pointer hover:bg-slate-900/40 transition-colors">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt="X Ad Preview" 
              className="w-full h-[200px] object-cover" 
            />
          )}
          <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[13px] text-slate-500 truncate block">goniflow.ge</span>
              <span className="text-[14px] font-semibold text-slate-200 block truncate mt-0.5">{ad.headline || "სიახლე ჩვენთან"}</span>
            </div>
            <button className="bg-white hover:bg-slate-200 text-black font-bold text-xs px-4 py-2 rounded-full shrink-0 transition-colors">
              {ad.cta}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ml-13 flex items-center justify-between text-slate-500 text-xs pt-1 max-w-sm">
          <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
            💬 <span>21</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
            🔁 <span>14</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
            ❤️ <span>98</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
            📊 <span>1.2K</span>
          </button>
        </div>
      </div>
    );
  };

  switch (platform) {
    case "facebook":
      return renderFacebook();
    case "instagram":
      return renderInstagram();
    case "linkedin":
      return renderLinkedIn();
    case "x":
      return renderX();
    default:
      return renderFacebook();
  }
}
