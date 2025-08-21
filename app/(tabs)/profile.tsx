import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { WhisperService } from '@/services/WhisperService';
import { Whisper } from '@/types';

export default function ProfileScreen() {
  const { session } = useSession();
  const { user, isAuthenticated } = useAuth();
  const [userWhispers, setUserWhispers] = useState<Whisper[]>([]);
  const [discoveredWhispers, setDiscoveredWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'discovered'>('created');
  const [stats, setStats] = useState<{ created?: number; discovered?: number; likesReceived?: number }>({});

  useEffect(() => {
    loadUserData();
  }, [isAuthenticated, user?.id, session.anonymousId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const effectiveSessionId = user?.id || session.anonymousId;

      const [created, discovered] = await Promise.all([
        WhisperService.getUserWhispers(effectiveSessionId),
        WhisperService.getDiscoveredWhispers(effectiveSessionId),
      ]);
      
      setUserWhispers(created);
      setDiscoveredWhispers(discovered);

      // Calculate total likes received on user's whispers
      const totalLikes = created.reduce((sum, whisper) => {
        return sum + (whisper.reactions?.length || 0);
      }, 0);

      if (isAuthenticated) {
        try {
          const profile = await WhisperService.getProfile();
          const s = profile?.user?.stats || {};
          setStats({
            created: s.whispersCreated || created.length,
            discovered: s.whispersDiscovered || discovered.length,
            likesReceived: s.likesReceived || totalLikes,
          });
        } catch {
          // Fallback to local calculation if profile fetch fails
          setStats({ 
            created: created.length, 
            discovered: discovered.length, 
            likesReceived: totalLikes 
          });
        }
      } else {
        setStats({ 
          created: created.length, 
          discovered: discovered.length, 
          likesReceived: totalLikes 
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getToneColor = (tone: string) => {
    const colors: { [key: string]: string } = {
      Joy: '#10b981',
      Longing: '#ec4899',
      Gratitude: '#f59e0b',
      Apology: '#8b5cf6',
      Heartbreak: '#ef4444',
    };
    return colors[tone] || '#6b7280';
  };

  const renderWhisperCard = (whisper: Whisper, isDiscovered = false) => (
    <View key={whisper._id} style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View 
            style={{ 
              backgroundColor: getToneColor(whisper.tone),
              width: 16,
              height: 16,
              borderRadius: 8,
              marginRight: 8
            }}
          />
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#374151'
          }}>
            {whisper.tone}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isDiscovered && (
            <Ionicons name="eye" size={16} color="#6b7280" style={{ marginRight: 8 }} />
          )}
          <Text style={{
            fontSize: 12,
            color: '#6b7280'
          }}>
            {formatTimeAgo(new Date(whisper.createdAt))}
          </Text>
        </View>
      </View>
      <Text style={{
        fontSize: 16,
        color: '#1f2937',
        marginBottom: 12,
        lineHeight: 24
      }}>
        "{whisper.text}"
      </Text>
      {whisper.whyHere && (
        <Text style={{
          fontSize: 14,
          color: '#6b7280',
          fontStyle: 'italic',
          marginBottom: 8
        }}>
          "{whisper.whyHere}"
        </Text>
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={{
            fontSize: 12,
            color: '#6b7280',
            marginLeft: 4
          }}>
            {whisper.location?.latitude?.toFixed?.(4) || 'N/A'}, {whisper.location?.longitude?.toFixed?.(4) || 'N/A'}
          </Text>
        </View>
        {!isDiscovered && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="heart" size={14} color="#ec4899" />
            <Text style={{
              fontSize: 12,
              color: '#6b7280',
              marginLeft: 4
            }}>
              {whisper.reactions?.length || 0} likes
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2
    }}>
      <View style={{ padding: 24 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          marginBottom: 16
        }}>
          Your Journey
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ec4899'
            }}>
              {stats.created ?? userWhispers.length}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#4b5563'
            }}>
              Whispers Created
            </Text>
          </View>
          <View style={{
            width: 1,
            backgroundColor: '#e5e7eb',
            marginHorizontal: 16
          }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              {stats.discovered ?? discoveredWhispers.length}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#4b5563'
            }}>
              Whispers Found
            </Text>
          </View>
          <View style={{
            width: 1,
            backgroundColor: '#e5e7eb',
            marginHorizontal: 16
          }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {stats.likesReceived ?? userWhispers.reduce((sum, w) => sum + (w.reactions?.length || 0), 0)}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#4b5563'
            }}>
              Likes Received
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#fdf2f8', '#e0e7ff']}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: 64, paddingBottom: 16 }}>
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#be185d'
          }}>
            Your Whispers
          </Text>
        </View>
        {user && (
          <Text style={{
            fontSize: 16,
            color: '#6b7280',
            textAlign: 'center',
            marginTop: 8
          }}>
            Welcome back, {user.displayName || user.username}!
          </Text>
        )}
      </View>
      {renderStats()}
      
      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('created')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            backgroundColor: activeTab === 'created' ? '#ec4899' : 'white'
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: '600',
            color: activeTab === 'created' ? 'white' : '#4b5563'
          }}>
            Created ({userWhispers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('discovered')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            backgroundColor: activeTab === 'discovered' ? '#3b82f6' : 'white'
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: '600',
            color: activeTab === 'discovered' ? 'white' : '#4b5563'
          }}>
            Discovered ({discoveredWhispers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUserData} />
        }
      >
        {activeTab === 'created' ? (
          userWhispers.length > 0 ? (
            userWhispers.map(whisper => renderWhisperCard(whisper))
          ) : (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center'
            }}>
              <Ionicons name="create" size={48} color="#d1d5db" />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#4b5563',
                marginTop: 16,
                marginBottom: 8
              }}>
                No whispers yet
              </Text>
              <Text style={{
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Share your first whisper to start connecting with others
              </Text>
            </View>
          )
        ) : (
          discoveredWhispers.length > 0 ? (
            discoveredWhispers.map(whisper => renderWhisperCard(whisper, true))
          ) : (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center'
            }}>
              <Ionicons name="search" size={48} color="#d1d5db" />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#4b5563',
                marginTop: 16,
                marginBottom: 8
              }}>
                No discoveries yet
              </Text>
              <Text style={{
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Explore the map to find whispers left by others
              </Text>
            </View>
          )
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </LinearGradient>
  );
}
