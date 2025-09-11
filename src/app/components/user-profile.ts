import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedDate: Date;
}

@Component({
  selector: 'app-user-profile',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  },
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-32 relative">
          <div class="absolute -bottom-16 left-8">
            @if (user().avatar) {
              <img 
                [ngSrc]="user().avatar!" 
                alt="Profile picture of {{ user().firstName }} {{ user().lastName }}"
                width="128"
                height="128"
                class="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                priority />
            } @else {
              <div class="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            }
          </div>
        </div>

        <!-- Profile Content -->
        <div class="pt-20 pb-8 px-8">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <!-- Profile Info -->
            <div class="flex-1">
              <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  {{ fullName() }}
                </h1>
                <p class="text-gray-600 text-lg">{{ user().email }}</p>
                @if (user().location) {
                  <p class="text-gray-500 mt-1">📍 {{ user().location }}</p>
                }
                @if (user().website) {
                  <a 
                    [href]="user().website" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 hover:text-blue-700 mt-1 inline-block">
                    🔗 {{ user().website }}
                  </a>
                }
              </div>

              @if (user().bio) {
                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-gray-900 mb-3">About</h2>
                  <p class="text-gray-700 leading-relaxed">{{ user().bio }}</p>
                </div>
              }

              <div class="text-sm text-gray-500">
                Member since {{ joinedDateFormatted() }}
              </div>
            </div>

            <!-- Edit Profile Form -->
            @if (isEditing()) {
              <div class="lg:w-96 bg-gray-50 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
                <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-4">
                  <div>
                    <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      id="firstName"
                      formControlName="firstName" 
                      type="text" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      [class.border-red-500]="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched" />
                    @if (profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched) {
                      <p class="text-xs text-red-600 mt-1" role="alert">First name is required.</p>
                    }
                  </div>

                  <div>
                    <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      id="lastName"
                      formControlName="lastName" 
                      type="text" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      [class.border-red-500]="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched" />
                    @if (profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched) {
                      <p class="text-xs text-red-600 mt-1" role="alert">Last name is required.</p>
                    }
                  </div>

                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      id="email"
                      formControlName="email" 
                      type="email" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      [class.border-red-500]="profileForm.get('email')?.invalid && profileForm.get('email')?.touched" />
                    @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                      <p class="text-xs text-red-600 mt-1" role="alert">Valid email is required.</p>
                    }
                  </div>

                  <div>
                    <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input 
                      id="location"
                      formControlName="location" 
                      type="text" 
                      placeholder="City, Country"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>

                  <div>
                    <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input 
                      id="website"
                      formControlName="website" 
                      type="url" 
                      placeholder="https://..."
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>

                  <div>
                    <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea 
                      id="bio"
                      formControlName="bio" 
                      rows="3"
                      placeholder="Tell us about yourself..."
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
                  </div>

                  <div class="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      (click)="onCancelEdit()"
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      [disabled]="profileForm.invalid || isSaving()"
                      class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      @if (isSaving()) {
                        <span class="inline-flex items-center gap-2">
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      } @else {
                        Save Changes
                      }
                    </button>
                  </div>
                </form>
              </div>
            } @else {
              <button 
                (click)="onEditProfile()"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Edit Profile
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class UserProfile {
  private readonly fb = inject(FormBuilder);

  // Signal-based state management
  readonly user = signal<User>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Full-stack developer passionate about creating amazing user experiences with modern web technologies.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    joinedDate: new Date('2023-01-15')
  });

  readonly isEditing = signal(false);
  readonly isSaving = signal(false);

  // Computed properties
  readonly fullName = computed(() => 
    `${this.user().firstName} ${this.user().lastName}`
  );

  readonly joinedDateFormatted = computed(() => 
    this.user().joinedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  );

  // Typed reactive form
  readonly profileForm: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    location: FormControl<string>;
    website: FormControl<string>;
    bio: FormControl<string>;
  }> = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    location: [''],
    website: [''],
    bio: ['']
  });

  onEditProfile(): void {
    const currentUser = this.user();
    this.profileForm.patchValue({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      location: currentUser.location || '',
      website: currentUser.website || '',
      bio: currentUser.bio || ''
    });
    this.isEditing.set(true);
  }

  onCancelEdit(): void {
    this.isEditing.set(false);
    this.profileForm.reset();
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);

    // Simulate API call
    setTimeout(() => {
      const formValue = this.profileForm.getRawValue();
      this.user.update(currentUser => ({
        ...currentUser,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        location: formValue.location || undefined,
        website: formValue.website || undefined,
        bio: formValue.bio || undefined
      }));

      this.isEditing.set(false);
      this.isSaving.set(false);
    }, 1500);
  }
}