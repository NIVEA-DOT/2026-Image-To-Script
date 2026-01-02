
import React from 'react';
import { SavedProject } from '../types';
import Button from './Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, projects, onLoad, onDelete }) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">🖼️ 생성 기록 (History)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
          {projects.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>저장된 기록이 없습니다.</p>
              <p className="text-sm mt-2">이미지를 생성하면 자동으로 여기에 저장됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {project.media.length > 0 && project.media[0].mediaUrl ? (
                        <img 
                          src={project.media[0].mediaUrl} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-indigo-600 mb-1">{formatDate(project.timestamp)}</p>
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">
                             {project.script.slice(0, 50)}{project.script.length > 50 ? '...' : ''}
                          </h3>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p>• 이미지: {project.media.length}장</p>
                        <p>• 비율: {project.aspectRatio}</p>
                        <p>• 스타일: {project.artStyle === 'Custom style' ? `Custom (${project.customArtStyle?.slice(0, 15)}...)` : project.artStyle}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col justify-end gap-2 mt-2 sm:mt-0">
                      <Button onClick={() => onLoad(project)} variant="primary" className="text-sm py-1 px-3">
                        불러오기
                      </Button>
                      <Button onClick={() => onDelete(project.id)} variant="danger" className="text-sm py-1 px-3 bg-white text-red-600 border border-red-200 hover:bg-red-50">
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-end">
          <Button onClick={onClose} variant="secondary">
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
