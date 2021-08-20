import { NextFunction, Request, Response } from 'express';
import { Bookmark } from '../database/entity/Bookmark';
import { Folder } from '../database/entity/Folder';
import { ArgumentsDoesNotExistError, UserDoesNotExistError } from '../errors';
import BookmarkRepository from '../repository/BookmarkRepository';
import FolderRepository from '../repository/FolderRepository';
import { isNilOrEmpty, isPresent } from '../utils/helpers';

export class BookmarkController {
  private bookmarkRepository = new BookmarkRepository();
  private folderRepository = new FolderRepository();

  async createBookmark(request: Request, response: Response, next: NextFunction) {
    try {
      const { folderId, url, name} = request.body;

      if (isNilOrEmpty(url) || isNilOrEmpty(name)) {
        throw ArgumentsDoesNotExistError();
      }

      let folder: Folder;

      if (isPresent(folderId)) {
        folder = await this.folderRepository.getFolder(folderId, { relations: ['user'] });

        if (isNilOrEmpty(folder)) {
          throw ArgumentsDoesNotExistError();
        }

        if (response.locals.user.id !== folder.user.id) {
          throw ArgumentsDoesNotExistError();
        }
      }

      const bookmark = await this.bookmarkRepository.createBookmark(response.locals.user, folder, url, name);

      return bookmark;
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  async deleteBookmark(request: Request, response: Response, next: NextFunction) {
    try {
      const { bookmarkId } = request.body;

      if (isNilOrEmpty(bookmarkId)) {
        throw ArgumentsDoesNotExistError();
      }

      const folderToDelete = await this.bookmarkRepository.getBookmark(bookmarkId);

      if (folderToDelete.user.id !== response.locals.user.id) {
        throw ArgumentsDoesNotExistError();
      }

      return this.bookmarkRepository.deleteBookmark(bookmarkId);
    } catch (error) {
      return next(error);
    }
  }

  async getMyBookmarks(request: Request, response: Response, next: NextFunction) {
    try {
      const { folderId } = request.body;
      let folder: Folder = null;

      if (isPresent(folderId)) {
        folder = await this.folderRepository.getFolder(folderId);

        if (folder.user.id !== response.locals.user.id) {
          throw ArgumentsDoesNotExistError();
        }
      }

      return this.bookmarkRepository.getBookmarks({
        where: { user: response.locals.user, folder },
      });
    } catch (error) {
      return next(error);
    }
  }

  async moveBookmark(request: Request, response: Response, next: NextFunction) {
    try {
      const {folderId, bookmarkId} = request.body;
      let folder: Folder = null;
      let bookmark: Bookmark = await this.bookmarkRepository.getBookmark(bookmarkId);

      if (bookmark.user.id !== response.locals.user.id) {
        throw ArgumentsDoesNotExistError();
      }

      if (isPresent(folderId)) {
        folder = await this.folderRepository.getFolder(folderId);

        if (folder.user.id !== response.locals.user.id) {
          throw ArgumentsDoesNotExistError();
        }
      }

      this.bookmarkRepository.updateBookmark({
        searchProps: bookmark,
        updatedValues: { parent: folder },
      })
    } catch (error) {
      return next(error);
    }
  }

  async changeDetails(request: Request, response: Response, next: NextFunction) {
    try {
      const { bookmarkId, name, url } = request.body;
      let bookmark: Bookmark = await this.bookmarkRepository.getBookmark(bookmarkId);

      if (bookmark.user.id !== response.locals.user.id) {
        throw ArgumentsDoesNotExistError();
      }

      this.bookmarkRepository.updateBookmark({
        searchProps: bookmark,
        updatedValues: { name, url },
      })
    } catch (error) {
      return next(error);
    }
  }

  async toggleFavorites(request: Request, response: Response, next: NextFunction) {
    try {
      const { bookmarkId, name, url } = request.body;
      let bookmark: Bookmark = await this.bookmarkRepository.getBookmark(bookmarkId);

      let isFavorite: boolean = bookmark.isFavorite ? false : true;

      if (bookmark.user.id !== response.locals.user.id) {
        throw ArgumentsDoesNotExistError();
      }

      this.bookmarkRepository.updateBookmark({
        searchProps: bookmark,
        updatedValues: { isFavorite },
      })
    } catch (error) {
      return next(error);
    }
  }
}

// move, changeDetails, toggleFavorites