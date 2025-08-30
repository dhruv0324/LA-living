'use client';

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { tagApi, Tag } from '@/lib/api';

interface TagSelectorProps {
  userId: string;
  tagType: 'Expense' | 'Income' | 'InternalLoan' | 'ExternalLoan';
  selectedTagId?: string;
  selectedTagName?: string;
  onTagSelect: (tag: Tag | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
}

const TagSelector: React.FC<TagSelectorProps> = ({
  userId,
  tagType,
  selectedTagId,
  selectedTagName,
  onTagSelect,
  label = 'Tag',
  placeholder = 'Select or create a tag',
  required = false,
  disabled = false,
  helperText,
  size = 'medium',
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
  // Create tag modal state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  // Load tags on component mount and when tagType changes
  useEffect(() => {
    loadTags();
  }, [userId, tagType]);

  // Set initial selected tag if provided
  useEffect(() => {
    if (selectedTagId && selectedTagName) {
      setSelectedTag({
        tag_id: selectedTagId,
        name: selectedTagName,
        type: tagType,
        user_id: userId,
        created_at: '',
      });
    } else {
      setSelectedTag(null);
    }
  }, [selectedTagId, selectedTagName, tagType, userId]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await tagApi.getAll(userId, tagType);
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (event: any, newValue: Tag | string | null) => {
    if (typeof newValue === 'string') {
      // User typed a new tag name
      setNewTagName(newValue);
      setOpenCreateModal(true);
    } else {
      // User selected an existing tag or cleared selection
      setSelectedTag(newValue);
      onTagSelect(newValue);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreating(true);
      const response = await tagApi.create({
        user_id: userId,
        name: newTagName.trim(),
        type: tagType,
      });
      
      const newTag = response.data;
      
      // Update tags list
      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Select the new tag
      setSelectedTag(newTag);
      onTagSelect(newTag);
      
      // Close modal
      setOpenCreateModal(false);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    setNewTagName('');
  };

  const getOptionLabel = (option: Tag | string) => {
    if (typeof option === 'string') {
      return option;
    }
    return option.name;
  };

  const renderOption = (props: any, option: Tag | string) => {
    if (typeof option === 'string') {
      return (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon fontSize="small" color="primary" />
          <Typography>Create "{option}"</Typography>
        </Box>
      );
    }
    
    return (
      <Box component="li" {...props}>
        <Chip
          label={option.name}
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>
    );
  };

  const filterOptions = (options: Tag[], params: any) => {
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(params.inputValue.toLowerCase())
    );

    const { inputValue } = params;
    const isExisting = options.some(option => option.name.toLowerCase() === inputValue.toLowerCase());

    if (inputValue !== '' && !isExisting) {
      filtered.push(inputValue);
    }

    return filtered;
  };

  return (
    <>
      <Autocomplete
        options={tags}
        value={selectedTag}
        onChange={handleTagChange}
        inputValue={searchValue}
        onInputChange={(event, newInputValue) => setSearchValue(newInputValue)}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        filterOptions={filterOptions}
        freeSolo
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        loading={loading}
        disabled={disabled}
        size={size}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={typeof option === 'string' ? option : option.tag_id}
              label={typeof option === 'string' ? option : option.name}
              size="small"
            />
          ))
        }
      />

      {/* Create Tag Modal */}
      <Dialog open={openCreateModal} onClose={handleCloseCreateModal} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Create a new {tagType.toLowerCase()} tag. Once created, tags cannot be deleted to maintain data integrity.
            </Typography>
            <TextField
              fullWidth
              label="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              autoFocus
              margin="normal"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creating) {
                  handleCreateTag();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTag}
            variant="contained"
            disabled={!newTagName.trim() || creating}
            startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create Tag'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TagSelector; 