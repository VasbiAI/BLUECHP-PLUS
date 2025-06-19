const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    // Validate destination selection
    if (destinationType === 'project' && !selectedProjectId) {
      setError('Please select a project');
      return;
    }

    if (destinationType === 'manual' && !selectedManualId) {
      setError('Please select a manual');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Call onUpload with the correct parameters based on destination type
      if (destinationType === 'project' && selectedProjectId !== null) {
        // Convert from number | null to number
        const projectId: number = selectedProjectId;
        await onUpload(file, documentName, documentType, projectId);
      } else if (destinationType === 'manual' && selectedManualId !== null) {
        // Convert from number | null to number
        const manualId: number = selectedManualId;
        await onUpload(file, documentName, documentType, undefined, manualId);
      } else {
        await onUpload(file, documentName, documentType);
      }

      // Reset form and close dialog automatically on success
      setFile(null);
      setDocumentName('');
      setDocumentType('general');
      setDestinationType('project');
      setSelectedProjectId(null);
      setSelectedManualId(null);
      onClose();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };