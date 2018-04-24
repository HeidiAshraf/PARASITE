import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../../content/category';
import { AdminService } from '../../../admin.service';
import { ToastrService } from 'ngx-toastr';
import { ContentService } from '../../../content/content.service';

@Component({
  selector: 'app-category-delete',
  templateUrl: './category-delete.component.html',
  styleUrls: ['./category-delete.component.scss']
})
export class CategoryDeleteComponent implements OnInit {
  @Input() inputCategories: Category[];
  categories: Category[];
  selectedCategory: Category = {
    _id: '',
    name: '',
    iconLink: ''
  };
  constructor(
    private adminService: AdminService,
    private toasterService: ToastrService,
    private contentService: ContentService
  ) { }

  ngOnInit() {
    this.categories = this.inputCategories;
  }
  deleteCategory() {
    const self = this;
    this.adminService.deleteCategory(this.selectedCategory).subscribe(function (res) {
      if (!res) {
        return;
      }
      self.categories = self.categories.filter(function (category) {
        return category._id !== self.selectedCategory._id;
      });
      self.toasterService.success(res.msg, 'success');
    });
  }
}
