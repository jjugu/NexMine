import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Skeleton, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, IconButton, Tooltip, Chip, Autocomplete,
  CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import axiosInstance from '../../../api/axiosInstance';
import type {
  UserGroupDto,
  AdminUserDto,
  AdminUserDtoPagedResult,
} from '../../../api/generated/model';

interface GroupFormData {
  name: string;
  description: string;
}

export default function AdminGroupsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<UserGroupDto | null>(null);
  const [detailGroup, setDetailGroup] = useState<UserGroupDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserGroupDto | null>(null);
  const [formError, setFormError] = useState('');

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Member add state
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);

  // Fetch groups
  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: () =>
      axiosInstance.get<UserGroupDto[]>('/admin/groups').then((res) => res.data),
  });

  // Fetch group detail (for member list)
  const { data: groupDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-groups', detailGroup?.id],
    queryFn: () =>
      axiosInstance
        .get<UserGroupDto>(`/admin/groups/${detailGroup!.id}`)
        .then((res) => res.data),
    enabled: !!detailGroup?.id,
  });

  // Fetch users for member autocomplete
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-search', memberSearchInput],
    queryFn: () =>
      axiosInstance
        .get<AdminUserDtoPagedResult>('/admin/users', {
          params: { search: memberSearchInput || undefined, pageSize: 50 },
        })
        .then((res) => res.data),
    enabled: !!detailGroup,
  });

  const availableUsers = (usersData?.items ?? []).filter(
    (u) =>
      !groupDetail?.members?.some((m) => m.userId === u.id),
  );

  // Save (create/update) mutation
  const saveMutation = useMutation({
    mutationFn: (data: GroupFormData) =>
      editGroup
        ? axiosInstance.put(`/admin/groups/${editGroup.id}`, data)
        : axiosInstance.post('/admin/groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(msg ?? '그룹 저장에 실패했습니다.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(msg ?? '그룹 삭제에 실패했습니다.');
      setDeleteConfirm(null);
    },
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: number; userIds: number[] }) =>
      axiosInstance.post(`/admin/groups/${groupId}/members`, { userIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(msg ?? '멤버 추가에 실패했습니다.');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      axiosInstance.delete(`/admin/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setFormError(msg ?? '멤버 제거에 실패했습니다.');
    },
  });

  function openCreate() {
    setEditGroup(null);
    setFormName('');
    setFormDescription('');
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(group: UserGroupDto) {
    setEditGroup(group);
    setFormName(group.name ?? '');
    setFormDescription(group.description ?? '');
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditGroup(null);
    setFormError('');
  }

  function openDetail(group: UserGroupDto) {
    setDetailGroup(group);
    setFormError('');
    setSelectedUser(null);
    setMemberSearchInput('');
  }

  function handleAddMember() {
    if (!detailGroup?.id || !selectedUser?.id) return;
    addMembersMutation.mutate({
      groupId: detailGroup.id,
      userIds: [selectedUser.id],
    });
  }

  function handleRemoveMember(userId: number) {
    if (!detailGroup?.id) return;
    removeMemberMutation.mutate({ groupId: detailGroup.id, userId });
  }

  function handleSave() {
    saveMutation.mutate({ name: formName, description: formDescription });
  }

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          sx={{ mb: 1, height: 48, borderRadius: 1 }}
        />
      ))}
    </Box>
  );

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">그룹 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  const groupList = groups ?? [];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h5">그룹 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          새 그룹
        </Button>
      </Box>

      {formError && !dialogOpen && !detailGroup && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      {isLoading ? (
        renderSkeleton()
      ) : groupList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 그룹이 없습니다.</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ mt: 2 }}
          >
            첫 그룹 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {groupList.map((group) => (
            <Card key={group.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box
                    sx={{ cursor: 'pointer', flex: 1 }}
                    onClick={() => openDetail(group)}
                  >
                    <Typography variant="subtitle2">{group.name}</Typography>
                    {group.description && (
                      <Typography variant="body2" color="text.secondary">
                        {group.description}
                      </Typography>
                    )}
                    <Chip
                      label={`${group.memberCount ?? 0}명`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Tooltip title="대시보드">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/admin/groups/${group.id}/dashboard`)}
                      >
                        <DashboardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => openEdit(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm(group)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>그룹명</TableCell>
                <TableCell>설명</TableCell>
                <TableCell align="center">멤버 수</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupList.map((group) => (
                <TableRow key={group.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => openDetail(group)}
                    >
                      {group.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${group.memberCount ?? 0}명`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="대시보드">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/admin/groups/${group.id}/dashboard`)}
                      >
                        <DashboardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => openEdit(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm(group)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editGroup ? '그룹 수정' : '새 그룹'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="그룹 이름"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <TextField
              label="설명"
              multiline
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!formName.trim() || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Detail (Members) Dialog */}
      <Dialog
        open={!!detailGroup}
        onClose={() => setDetailGroup(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {detailGroup?.name} - 멤버 관리
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}

          {/* Add member section */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2, alignItems: 'center' }}>
            <Autocomplete
              sx={{ flex: 1 }}
              options={availableUsers}
              getOptionLabel={(option) =>
                `${option.username ?? ''} (${option.email ?? ''})`
              }
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              inputValue={memberSearchInput}
              onInputChange={(_, newInput) => setMemberSearchInput(newInput)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="멤버 추가"
                  placeholder="사용자 검색..."
                  size="small"
                />
              )}
              noOptionsText="검색 결과 없음"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Tooltip title="멤버 추가">
              <span>
                <IconButton
                  color="primary"
                  disabled={!selectedUser || addMembersMutation.isPending}
                  onClick={handleAddMember}
                >
                  {addMembersMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PersonAddIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Members list */}
          {isDetailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (groupDetail?.members ?? []).length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              멤버가 없습니다.
            </Typography>
          ) : (
            <List dense>
              {(groupDetail?.members ?? []).map((member) => (
                <ListItem key={member.userId}>
                  <ListItemText
                    primary={member.userName}
                    secondary={member.email}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={member.userName ?? ''}
                      size="small"
                      onDelete={() => {
                        if (member.userId != null) {
                          handleRemoveMember(member.userId);
                        }
                      }}
                      sx={{ mr: 0.5 }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailGroup(null)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>그룹 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 그룹을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            그룹 삭제 시 멤버 연결이 해제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() =>
              deleteConfirm?.id && deleteMutation.mutate(deleteConfirm.id)
            }
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
